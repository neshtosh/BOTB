-- Unsigned: full database setup for a NEW, empty Supabase project.
-- Paste all of this into Supabase → SQL Editor → New query, then click Run.
-- It's migrations 0001–0003 (supabase/migrations/) in order, plus table grants,
-- wrapped in one transaction: if anything fails, nothing is applied.
-- Run it once only; on a project that already has these tables it will fail.

begin;

-- ===========================================================================
-- 0001_creator_platform.sql
-- ===========================================================================

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

-- ===========================================================================
-- 0002_clips_and_analytics.sql
-- ===========================================================================

-- Clips (short versions of an upload made for social platforms) and
-- per-post analytics pulled from each platform.

-- A clip is its own content item pointing at the upload it was cut from.
alter table public.content_items
  add column parent_id uuid references public.content_items (id) on delete cascade,
  add column clip_start real,
  add column clip_duration real;

create index content_items_parent_idx on public.content_items (parent_id);

-- Platform-specific references we need later (e.g. TikTok's publish id,
-- which is different from the id of the finished video).
alter table public.publish_jobs
  add column external_meta jsonb not null default '{}'::jsonb;

create table public.post_metrics (
  job_id uuid primary key references public.publish_jobs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  views bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  extra jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

alter table public.post_metrics enable row level security;

create policy "Owners see their metrics"
  on public.post_metrics for select using (auth.uid() = user_id);

-- ===========================================================================
-- 0003_releases.sql
-- ===========================================================================

-- Releases (single / EP / album), track credits, scheduled posts, smart links
-- with pre-saves, and split records.

-- ---------------------------------------------------------------------------
-- Releases
-- ---------------------------------------------------------------------------
create table public.releases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  title text not null,
  artist_name text not null,
  kind text not null check (kind in ('single', 'ep', 'album')),
  primary_genre text not null,
  secondary_genre text,
  language text not null default 'English',
  description text not null default '',
  tags text[] not null default '{}',
  previously_released boolean not null default false,
  original_release_date date,
  -- null = posts go out as soon as they're processed.
  release_at timestamptz,
  cover_path text,
  is_public boolean not null default true,
  -- [{ name, email, role, share }] — a record only; Unsigned never holds or pays out money.
  splits jsonb not null default '[]'::jsonb,
  smart_link_visits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index releases_user_idx on public.releases (user_id);

alter table public.releases enable row level security;

create policy "Owners manage their releases"
  on public.releases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Public releases are visible"
  on public.releases for select using (is_public);

-- ---------------------------------------------------------------------------
-- Tracks are content items that belong to a release.
-- ---------------------------------------------------------------------------
alter table public.content_items
  add column release_id uuid references public.releases (id) on delete cascade,
  add column track_number integer,
  add column version text not null default '',
  add column featured_artists jsonb not null default '[]'::jsonb,
  add column songwriters text[] not null default '{}',
  add column is_cover boolean not null default false,
  add column explicit boolean not null default false,
  add column instrumental boolean not null default false,
  add column ai_generated boolean not null default false,
  add column hook_start real;

create index content_items_release_idx on public.content_items (release_id, track_number);

-- ---------------------------------------------------------------------------
-- Scheduled posts: created at upload time, published by api/cron/scheduled.
-- ---------------------------------------------------------------------------
alter table public.publish_jobs drop constraint if exists publish_jobs_status_check;
alter table public.publish_jobs
  add constraint publish_jobs_status_check
    check (status in ('queued', 'scheduled', 'processing', 'published', 'failed')),
  add column scheduled_for timestamptz;

create index publish_jobs_due_idx on public.publish_jobs (scheduled_for) where status = 'scheduled';

-- ---------------------------------------------------------------------------
-- Smart-link pre-saves: anyone can leave an email, owners read their list.
-- ---------------------------------------------------------------------------
create table public.release_presaves (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now(),
  unique (release_id, email)
);

alter table public.release_presaves enable row level security;

create policy "Anyone can pre-save a public release"
  on public.release_presaves for insert to anon, authenticated
  with check (exists (select 1 from public.releases r where r.id = release_id and r.is_public));
create policy "Owners read their pre-saves"
  on public.release_presaves for select
  using (exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Smart-link data for visitors: the release plus links to its live posts.
-- Publish jobs stay private; this exposes only what the page needs.
-- ---------------------------------------------------------------------------
create or replace function public.smart_link(release_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'release', to_jsonb(r) - 'splits' - 'user_id',
    'owner', jsonb_build_object('handle', p.handle, 'display_name', p.display_name),
    'tracks', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'title', c.title, 'track_number', c.track_number,
        'version', c.version, 'explicit', c.explicit) order by c.track_number)
      from content_items c where c.release_id = r.id
    ), '[]'::jsonb),
    'links', coalesce((
      select jsonb_agg(jsonb_build_object('target', j.target, 'url', j.external_url,
        'track_id', coalesce(c.parent_id, c.id), 'from_clip', c.parent_id is not null, 'published_at', j.updated_at))
      from publish_jobs j
      join content_items c on c.id = j.content_id
      left join content_items parent on parent.id = c.parent_id
      where j.status = 'published' and j.external_url is not null
        and coalesce(parent.release_id, c.release_id) = r.id
        and coalesce(j.options ->> 'privacy', 'public') = 'public'
    ), '[]'::jsonb)
  )
  from releases r
  join profiles p on p.id = r.user_id
  where r.slug = release_slug and r.is_public;
$$;

create or replace function public.track_release_visit(release_slug text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update releases set smart_link_visits = smart_link_visits + 1 where slug = release_slug and is_public;
$$;

grant execute on function public.smart_link(text) to anon, authenticated;
grant execute on function public.track_release_visit(text) to anon, authenticated;

-- Cover art of public releases is readable by anyone (smart links, fan pages).
create policy "Public release covers are readable"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'media'
    and exists (select 1 from public.releases r where r.cover_path = storage.objects.name and r.is_public)
  );

-- Creators can move posts that are still waiting for release day (rescheduling).
create policy "Owners reschedule waiting posts"
  on public.publish_jobs for update
  using (auth.uid() = user_id and status = 'scheduled')
  with check (auth.uid() = user_id and status = 'scheduled');

-- ===========================================================================
-- Grants. Newer Supabase projects can be created without automatic table
-- access for the API roles; these make sure the app can reach its tables.
-- Row level security (above) still decides which rows each user sees.
-- ===========================================================================

grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon;
grant insert on public.newsletter_subscribers, public.release_presaves to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

commit;
