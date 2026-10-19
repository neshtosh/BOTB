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
