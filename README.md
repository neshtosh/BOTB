# Unsigned — Be your own label

The release desk for independent artists and creators: upload once, clip the
hook, and publish to YouTube, TikTok, Instagram, Facebook and SoundCloud yourself.

## Demo mode (no setup needed)

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are not set (or `VITE_DEMO_MODE=true`),
the app runs against an **in-browser mock backend** (`src/lib/demo/`) so the whole UI
works without any services:

| | |
| --- | --- |
| Demo login | `demo@unsigned.app` / `unsigned-demo` (fictional creator “Kasi Moto”) |
| Sign up | works too — accounts are stored only in your browser |
| Data | localStorage + IndexedDB for uploaded files; seed media is generated in the browser |
| Platforms | mock consent screens at `/demo/connect/:provider`, simulated publishing, analytics that grow over time, simulated posts at `/demo/post/:id` |
| Reset | click the yellow **Demo mode** badge (bottom-left) → Reset demo data |

Demo mode follows the same rules as the real backend (which formats each platform takes,
connections required, per-user data). Set the Supabase variables to switch to live mode.

## What's in it

- **Landing page** (`/`): what Unsigned is and how it works
- **Creator pages**: every creator gets `/c/<handle>` with their public uploads and their own mailing list
- **Creator studio**: `/dashboard` for uploads, platform connections, publishing, analytics and profile
- **Per-platform posts**: each platform gets the full file or a clip, with its own caption. Songs only go to social platforms as clips; SoundCloud gets the full track.
- **Clip maker**: finds a song's hook (loud and repeated sections, usually the chorus) and renders a vertical 720×1280 MP4 in the browser with ffmpeg.wasm
- **Analytics**: views, likes, comments and shares from every platform on one page
- **API** (`api/`): Vercel serverless functions for OAuth and publishing; platform tokens never reach the browser

Stack: React 18 + Vite + Tailwind, Supabase (auth, Postgres, storage), Vercel.

## Setup

### 1. Supabase
1. Create a project at supabase.com.
2. In the SQL editor, run the migrations in order:
   [`0001_creator_platform.sql`](supabase/migrations/0001_creator_platform.sql), then
   [`0002_clips_and_analytics.sql`](supabase/migrations/0002_clips_and_analytics.sql).
3. Storage: the migration creates a private `media` bucket. On the free plan, Supabase caps uploads at **50 MB per file**. Raise the limit under Storage → Settings on a paid plan for real video files.
4. Auth → URL Configuration: set the Site URL to your domain and add `https://YOUR-DOMAIN/dashboard` to the redirect URLs.

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill it in. Add the same values in Vercel.

### 3. Platform apps
Each platform needs a developer app. The redirect URL for each is
`APP_URL/api/oauth/callback/<provider>`:

| Platform | Redirect path | Notes |
| --- | --- | --- |
| YouTube | `/api/oauth/callback/youtube` | Enable *YouTube Data API v3*. Until Google audits the project, uploads are forced to **private** and quota allows ~6 uploads/day. |
| TikTok | `/api/oauth/callback/tiktok` | Add Login Kit + Content Posting API (Direct Post). Until TikTok audits the app, posts are **only visible to the creator**. |
| Facebook / Instagram | `/api/oauth/callback/meta` | Business app with Facebook Login. Publishing needs a Facebook Page, plus an Instagram Business/Creator account linked to it. Needs Meta App Review before the public can use it. |
| SoundCloud | `/api/oauth/callback/soundcloud` | API access must be requested from SoundCloud. |

Spotify and Apple Music have no public upload API. Music reaches them only through a
distributor, so they're shown as "coming soon" in the UI.

### 4. Run locally
- `npm run dev` runs the site only. Login works, but `/api/*` calls (connect, publish) won't.
- `npx vercel dev` runs the site and the API functions together (set `APP_URL=http://localhost:3000`).

## How publishing works
1. The creator uploads a file in the studio. It goes to Supabase Storage under `<user id>/…` and gets a `content_items` row.
2. For each chosen platform, the browser calls `POST /api/publish`. Each call is its own function run (max 300 s).
3. The function refreshes the platform token if needed, then uploads:
   YouTube (resumable upload), TikTok (chunked upload), SoundCloud (multipart), or
   Facebook / Instagram (the platform pulls the file from a 1-hour signed URL).
4. The result is stored in `publish_jobs` and shown in the dashboard with a link to the live post.

### Clips
When any platform is set to "Clip", the browser cuts one clip from the original file and uploads it
as a child `content_items` row (`parent_id` points at the original). Every platform set to "Clip" posts that same file.
- Audio becomes a still-image video: the creator's cover art, or a generated title card.
  A 30-second clip takes roughly a minute to render on a typical laptop.
- Video is cut with stream copy, which is near-instant but snaps to the nearest keyframe.
- The ffmpeg core (~30 MB) downloads from unpkg the first time a creator makes a clip, then the browser caches it.

### Analytics
**Refresh stats** on the Analytics page calls `POST /api/analytics`. That pulls numbers from each platform into `post_metrics`.
Analytics needs extra permissions (`video.list` on TikTok, `instagram_manage_insights` and `read_insights` on Meta).
Accounts connected before those were added must be **reconnected**. Meta also has to approve these permissions in App Review.

**Known limits (v1):** files are read fully into function memory (2 GB), and each publish
must finish within 5 minutes. That's fine for typical clips and tracks. Long videos will need a
background worker queue. Meta uses the first Facebook Page found (Pages with Instagram linked are preferred).

## Content still to replace
- `src/config/site.ts`: name, tagline, contact email, press kit
- `src/data/socialData.ts`: real social profile URLs
- `src/data/*.ts`: albums, videos and events. Most media files referenced there don't exist yet in `public/media`.
- `src/pages/About.tsx`: bio (currently lorem ipsum)
- `public/privacy-policy.html` and `public/terms-of-service.html`: these need updating now that the site stores accounts, uploads and platform tokens.
