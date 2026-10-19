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
