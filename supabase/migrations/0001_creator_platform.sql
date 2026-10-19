-- Creator platform schema: profiles, content library, platform connections,
-- publish jobs and newsletter signups. Run in the Supabase SQL editor
-- (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- Profiles: one per auth user, doubles as the public creator page.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null,
  creator_type text not null default 'musician'
    check (creator_type in ('musician', 'video', 'podcaster', 'photographer', 'other')),
  bio text not null default '',
  avatar_url text,
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are public"
  on public.profiles for select using (true);
create policy "Users update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create the profile from the sign-up metadata so the client never has to.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name, creator_type)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'handle'),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'handle'),
    coalesce(new.raw_user_meta_data ->> 'creator_type', 'musician')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Content library: every uploaded file plus the metadata we publish with it.
-- ---------------------------------------------------------------------------
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  media_type text not null check (media_type in ('video', 'audio')),
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index content_items_user_idx on public.content_items (user_id, created_at desc);

alter table public.content_items enable row level security;

create policy "Owners manage their content"
  on public.content_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Public content is visible"
  on public.content_items for select using (is_public);

-- ---------------------------------------------------------------------------
-- Platform connections. Tokens live in a separate table with RLS on and no
-- policies, so only the server (service role) can ever read them.
-- ---------------------------------------------------------------------------
create table public.platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('youtube', 'tiktok', 'meta', 'soundcloud')),
  account_name text not null,
  account_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.platform_connections enable row level security;

create policy "Owners see their connections"
  on public.platform_connections for select using (auth.uid() = user_id);
create policy "Owners remove their connections"
  on public.platform_connections for delete using (auth.uid() = user_id);

create table public.platform_tokens (
  connection_id uuid primary key references public.platform_connections (id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  extra jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.platform_tokens enable row level security;

-- Short-lived OAuth state (CSRF protection + PKCE verifier). Server-only.
create table public.oauth_states (
  state text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null,
  code_verifier text,
  created_at timestamptz not null default now()
);

alter table public.oauth_states enable row level security;

-- ---------------------------------------------------------------------------
-- Publish jobs: one row per (content, target platform) push.
-- ---------------------------------------------------------------------------
create table public.publish_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete cascade,
  target text not null check (target in ('youtube', 'tiktok', 'facebook', 'instagram', 'soundcloud')),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'published', 'failed')),
  options jsonb not null default '{}'::jsonb,
  external_id text,
  external_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index publish_jobs_content_idx on public.publish_jobs (content_id);
create index publish_jobs_user_idx on public.publish_jobs (user_id, created_at desc);

alter table public.publish_jobs enable row level security;

create policy "Owners see their publish jobs"
  on public.publish_jobs for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Newsletter: anyone can sign up; creators can read their own list.
-- creator_id null = the main site's list.
-- ---------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  creator_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique nulls not distinct (email, creator_id)
);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert to anon, authenticated with check (true);
create policy "Creators read their subscribers"
  on public.newsletter_subscribers for select using (auth.uid() = creator_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket, files stored under "<user id>/...".
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

create policy "Owners upload to their folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners read their files"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners delete their files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Public content files are readable"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.content_items c
      where c.storage_path = storage.objects.name and c.is_public
    )
  );
