import type { LucideIcon } from 'lucide-react';
import { Coins, Disc3, Info, Megaphone, Radio, UserCog } from 'lucide-react';

// Help centre content. Written for Unsigned; keep answers short and plain.

export type HelpCategoryId = 'basics' | 'releases' | 'platforms' | 'promotion' | 'money' | 'account';

export interface HelpCategory {
  id: HelpCategoryId;
  title: string;
  blurb: string;
  icon: LucideIcon;
}

// One piece of an article body.
export type Block =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; tone: 'tip' | 'warning'; text: string }
  | { type: 'link'; slug: string; label?: string };

export interface HelpArticle {
  slug: string;
  category: HelpCategoryId;
  title: string;
  summary: string;
  body: Block[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: 'basics', title: 'Basics', blurb: 'What Unsigned is, who it is for and what it costs.', icon: Info },
  { id: 'releases', title: 'Releases & uploading', blurb: 'Release types, files, cover art and scheduling.', icon: Disc3 },
  { id: 'platforms', title: 'Platforms', blurb: 'Where your releases can go and how to connect.', icon: Radio },
  { id: 'promotion', title: 'Promotion', blurb: 'Smart links, pre-saves, your page and rollout tips.', icon: Megaphone },
  { id: 'money', title: 'Money & splits', blurb: 'Getting paid, sharing credit and reading stats.', icon: Coins },
  { id: 'account', title: 'Account & privacy', blurb: 'Your profile, your data and getting in touch.', icon: UserCog },
];

export const HELP_ARTICLES: HelpArticle[] = [
  // Basics
  {
    slug: 'what-is-unsigned',
    category: 'basics',
    title: 'What is Unsigned?',
    summary: 'A release desk that posts your music and videos to your own accounts.',
    body: [
      { type: 'p', text: 'Unsigned is a release desk for independent artists. You upload a track or video once, and Unsigned cuts a clip of the hook, writes the captions and posts it to the platforms you pick.' },
      { type: 'p', text: 'Everything goes out on your own accounts, under your own name. You choose where it goes and when, and you keep the fan list you build along the way.' },
      { type: 'link', slug: 'unsigned-vs-distributors' },
    ],
  },
  {
    slug: 'who-is-unsigned-for',
    category: 'basics',
    title: 'Who is Unsigned for?',
    summary: 'Artists, producers, DJs, podcasters and anyone running their own releases.',
    body: [
      { type: 'p', text: 'Unsigned is for people who release their own work without a label or manager doing it for them.' },
      { type: 'list', items: ['Singers, rappers and bands putting out singles and projects', 'Producers and DJs sharing beats and mixes', 'Podcasters who want a clip of the best moment for socials', 'Video creators who post the same piece to several platforms'] },
      { type: 'p', text: 'If you are tired of uploading the same thing five times, it is for you.' },
    ],
  },
  {
    slug: 'unsigned-vs-distributors',
    category: 'basics',
    title: 'How is Unsigned different from a distributor?',
    summary: 'We post to your own accounts, and each platform pays you directly.',
    body: [
      { type: 'p', text: 'A distributor delivers your music to streaming stores and collects royalties on your behalf before passing them on.' },
      { type: 'p', text: 'Unsigned works differently. It posts to accounts you already own, such as your YouTube channel or TikTok profile. The platform sees you as the uploader, and pays you directly through its own creator programme.' },
      { type: 'callout', tone: 'tip', text: 'Because the money never passes through us, Unsigned takes 0% of what you earn.' },
      { type: 'link', slug: 'why-not-spotify' },
    ],
  },
  {
    slug: 'pricing',
    category: 'basics',
    title: 'How much does Unsigned cost?',
    summary: 'Free during early access. Paid plans later, with notice first.',
    body: [
      { type: 'p', text: 'Unsigned is free while it is in early access. There is no card to enter and no trial that runs out.' },
      { type: 'p', text: 'Paid plans will arrive later. We will tell you well before anything changes, so you have time to decide.' },
      { type: 'callout', tone: 'tip', text: 'Whatever the plan, we do not take a cut of your earnings.' },
    ],
  },
  {
    slug: 'do-i-need-a-label',
    category: 'basics',
    title: 'Do I need a label or a manager?',
    summary: 'No. Unsigned is built for people who run their own releases.',
    body: [
      { type: 'p', text: 'No. You upload, you choose where it goes, you see the numbers and you keep your fan list.' },
      { type: 'p', text: 'If you do work with a manager or a team, you can still use Unsigned. Just keep one account for the artist and share the sign-in sensibly.' },
    ],
  },
  {
    slug: 'demo-mode',
    category: 'basics',
    title: 'What is demo mode?',
    summary: 'A try-before-launch version that runs entirely in your browser.',
    body: [
      { type: 'p', text: 'Demo mode lets you click through the whole of Unsigned without a server behind it. A badge on screen tells you when you are in it.' },
      { type: 'list', items: ['Nothing is uploaded or posted for real; platform sign-ins and posts are stand-ins', 'Your releases, links and settings are saved only in this browser', 'Clearing your browser data, or switching device, starts you fresh', 'You can sign in with the demo login shown on the log-in page'] },
      { type: 'callout', tone: 'warning', text: 'Do not use demo mode for anything you need to keep.' },
    ],
  },

  // Releases & uploading
  {
    slug: 'release-types',
    category: 'releases',
    title: 'Single, EP or album?',
    summary: 'The release type is set by how many tracks it has.',
    body: [
      { type: 'list', items: ['Single: 1 to 3 tracks', 'EP: 4 to 6 tracks', 'Album: 7 tracks or more'] },
      { type: 'p', text: 'A release can hold up to 30 tracks. Unsigned picks the type for you as you add tracks.' },
      { type: 'link', slug: 'release-form' },
    ],
  },
  {
    slug: 'release-form',
    category: 'releases',
    title: 'The release form, step by step',
    summary: 'Seven short steps from platforms to review.',
    body: [
      { type: 'p', text: 'New releases are created in the studio under Publish. The form walks you through:' },
      { type: 'list', items: ['Platforms: pick where it goes', 'Release details: title, artist name, genre and cover art', 'Tracks: upload files and fill in credits', 'Where it goes: full track or clip for each platform', 'Release date: now, or a date and time', 'Splits: who is owed what share', 'Review: check everything, then submit'] },
      { type: 'callout', tone: 'tip', text: 'You can go back to any step before you submit.' },
    ],
  },
  {
    slug: 'file-formats',
    category: 'releases',
    title: 'Which audio and video files can I upload?',
    summary: 'WAV or FLAC are best. MP3, M4A, AIFF, OGG, MP4, MOV and WebM work too.',
    body: [
      { type: 'p', text: 'For audio, upload a WAV or FLAC file if you have one. They keep the full quality of your master.' },
      { type: 'p', text: 'MP3, M4A, AIFF and OGG also work. For video, use MP4, MOV or WebM.' },
      { type: 'callout', tone: 'tip', text: 'Platforms compress everything again, so starting from the best file you have gives the best result.' },
    ],
  },
  {
    slug: 'cover-art',
    category: 'releases',
    title: 'Cover art requirements',
    summary: 'Square, at least 1000×1000, JPG or PNG, under 10 MB.',
    body: [
      { type: 'list', items: ['Square, at least 1000×1000 pixels (3000×3000 is ideal)', 'JPG or PNG, under 10 MB', 'RGB colour, not CMYK'] },
      { type: 'callout', tone: 'warning', text: 'Leave out website addresses, QR codes, social or streaming logos and prices, and avoid blurry images. Platforms may reject art that has them.' },
      { type: 'p', text: 'No artwork yet? Unsigned can generate a simple cover from your release title.' },
    ],
  },
  {
    slug: 'track-details',
    category: 'releases',
    title: 'Filling in track details',
    summary: 'Featured artists, versions, songwriters and content flags.',
    body: [
      { type: 'p', text: 'Each track has its own details. Fill them in carefully, because they show up wherever the track is posted.' },
      { type: 'list', items: ['Featured artists: anyone credited as "feat."', 'Version: Live, Acoustic, Remix and so on, if it is not the original', 'Songwriters: their real names, not stage names', 'Explicit: tick it if the lyrics need a warning', 'Instrumental: tick it if there are no vocals'] },
    ],
  },
  {
    slug: 'cover-songs',
    category: 'releases',
    title: 'Can I release a cover song?',
    summary: 'Only if you hold the rights. Platforms may mute or claim covers.',
    body: [
      { type: 'p', text: 'You can upload a cover, but you must hold the rights to release it. That usually means a licence from the song’s publisher.' },
      { type: 'callout', tone: 'warning', text: 'Platforms may mute a cover, or let the original rights holder claim it and its earnings.' },
      { type: 'p', text: 'Unsigned does not sell cover licences, so arrange that before you upload.' },
    ],
  },
  {
    slug: 'ai-music',
    category: 'releases',
    title: 'Releasing AI-made music',
    summary: 'Mark it per track. You are responsible for the rights.',
    body: [
      { type: 'p', text: 'If a track was made fully or partly with AI tools, mark it on that track in the release form. Some platforms label AI content, and this keeps you on the right side of their rules.' },
      { type: 'p', text: 'You are responsible for having the rights to everything in the track, including anything an AI tool produced.' },
    ],
  },
  {
    slug: 'hook-clips',
    category: 'releases',
    title: 'How hook clips work',
    summary: 'Unsigned finds the catchiest 15, 30 or 60 seconds, and you can move it.',
    body: [
      { type: 'p', text: 'For short-video platforms, Unsigned listens to your track and picks the catchiest stretch for a 15, 30 or 60 second clip.' },
      { type: 'p', text: 'Not the bit you wanted? Drag the clip window to any part of the track before you submit.' },
      { type: 'link', slug: 'release-dates' },
    ],
  },
  {
    slug: 'release-dates',
    category: 'releases',
    title: 'Release dates and scheduling',
    summary: 'Post as soon as possible, or pick a date and time.',
    body: [
      { type: 'p', text: 'Choose "As soon as possible" to post straight after you submit, or pick a date and time.' },
      { type: 'p', text: 'Scheduled posts go out within a few minutes of the time you set.' },
      { type: 'callout', tone: 'tip', text: 'Clips are rendered when you submit, not on release day, so they are ready to go on time.' },
      { type: 'link', slug: 'rollout-tips' },
    ],
  },
  {
    slug: 'editing-a-release',
    category: 'releases',
    title: 'Editing a release after upload',
    summary: 'Change details in Unsigned; edit live posts on the platform itself.',
    body: [
      { type: 'p', text: 'You can change the title, genre and cover art of a release in Unsigned at any time. Your smart link and fan page update straight away.' },
      { type: 'callout', tone: 'warning', text: 'Posts that are already live on a platform do not change. Edit those in the platform’s own app.' },
    ],
  },
  {
    slug: 'deleting-a-release',
    category: 'releases',
    title: 'Deleting a release',
    summary: 'It is removed from Unsigned and your fan page. Platform posts stay.',
    body: [
      { type: 'p', text: 'Deleting a release removes it from your studio, your smart link and your creator page.' },
      { type: 'callout', tone: 'warning', text: 'Anything already posted to YouTube, TikTok or another platform stays there. Delete those posts on each platform if you want them gone.' },
    ],
  },
  {
    slug: 'release-status',
    category: 'releases',
    title: 'What do the status colours mean?',
    summary: 'Green is live, yellow is on its way, red needs you.',
    body: [
      { type: 'list', items: ['Green: live on the platform', 'Yellow: processing, or scheduled for later', 'Red: needs attention, such as a rejected post or a disconnected account'] },
      { type: 'p', text: 'Open a red item to see what went wrong and how to fix it.' },
      { type: 'link', slug: 'connecting-accounts' },
    ],
  },

  // Platforms
  {
    slug: 'supported-platforms',
    category: 'platforms',
    title: 'Which platforms can I post to?',
    summary: 'YouTube, TikTok, Instagram Reels, Facebook Pages and SoundCloud.',
    body: [
      { type: 'list', items: ['YouTube (full videos and Shorts)', 'TikTok', 'Instagram Reels', 'Facebook Pages', 'SoundCloud'] },
      { type: 'p', text: 'You connect each one once, then tick the ones you want on every release.' },
      { type: 'link', slug: 'why-not-spotify' },
    ],
  },
  {
    slug: 'youtube',
    category: 'platforms',
    title: 'Posting to YouTube',
    summary: 'Full videos, Shorts clips, or both.',
    body: [
      { type: 'p', text: 'For YouTube you can post the full video, a vertical Shorts clip of the hook, or both.' },
      { type: 'p', text: 'Uploading a song as audio? YouTube gets a Shorts clip of the hook, rendered as a video over your cover art.' },
    ],
  },
  {
    slug: 'tiktok',
    category: 'platforms',
    title: 'Posting to TikTok',
    summary: 'Clips only for songs. Posts stay private until TikTok approves our app.',
    body: [
      { type: 'p', text: 'For songs, TikTok always gets a clip rather than the full track.' },
      { type: 'callout', tone: 'warning', text: 'Until TikTok approves the Unsigned app, posts go up as private (only you can see them). You can make them public in the TikTok app.' },
    ],
  },
  {
    slug: 'instagram',
    category: 'platforms',
    title: 'Posting to Instagram Reels',
    summary: 'You need a Business or Creator account linked to a Facebook Page.',
    body: [
      { type: 'p', text: 'Instagram only lets apps post to Business or Creator accounts that are linked to a Facebook Page.' },
      { type: 'list', items: ['Switch to a Business or Creator account in Instagram settings', 'Link it to a Facebook Page you manage', 'Then connect Instagram in Unsigned'] },
      { type: 'p', text: 'Songs go to Reels as a clip.' },
    ],
  },
  {
    slug: 'facebook',
    category: 'platforms',
    title: 'Posting to Facebook Pages',
    summary: 'Post to a Page you manage, not a personal profile.',
    body: [
      { type: 'p', text: 'Unsigned posts to Facebook Pages, not personal profiles. You need to manage at least one Page.' },
      { type: 'p', text: 'If you manage several Pages, Unsigned uses the one linked to your Instagram Business or Creator account, or your first Page if none is linked. Choosing a different Page is coming soon.' },
    ],
  },
  {
    slug: 'soundcloud',
    category: 'platforms',
    title: 'Posting to SoundCloud',
    summary: 'Full tracks, audio only.',
    body: [
      { type: 'p', text: 'SoundCloud gets the full track as audio, with your title, description and tags. Add artwork in SoundCloud for now; sending cover art there is coming soon.' },
      { type: 'p', text: 'SoundCloud does not take video, so it only appears as an option for audio uploads.' },
    ],
  },
  {
    slug: 'why-not-spotify',
    category: 'platforms',
    title: 'Why not Spotify or Apple Music?',
    summary: 'They only take music through distributors. Support is coming.',
    body: [
      { type: 'p', text: 'Spotify, Apple Music and other streaming services only accept music from distributors. They do not let apps upload directly to an artist profile.' },
      { type: 'p', text: 'We are working on a distributor connection so your releases can reach those services too.' },
      { type: 'link', slug: 'unsigned-vs-distributors' },
    ],
  },
  {
    slug: 'connecting-accounts',
    category: 'platforms',
    title: 'Connecting and disconnecting accounts',
    summary: 'Sign in on the platform’s own page. We never see your password.',
    body: [
      { type: 'p', text: 'In the studio, open Connections and choose a platform. You sign in on that platform’s own page and approve access for Unsigned.' },
      { type: 'callout', tone: 'tip', text: 'We never see your passwords. The access keys are stored on our server and never sent to your browser.' },
      { type: 'p', text: 'You can disconnect at any time from Connections, or remove Unsigned from the platform’s own app settings.' },
    ],
  },

  // Promotion
  {
    slug: 'smart-links',
    category: 'promotion',
    title: 'Smart links and pre-saves',
    summary: 'Every release gets its own page at /r/your-release.',
    body: [
      { type: 'p', text: 'Each release gets a smart link at /r/your-release that you can share anywhere.' },
      { type: 'list', items: ['Before release day it collects pre-save emails from fans', 'After release it shows links to every post', 'In the studio you can see visits and pre-saves', 'Export the emails as a CSV file whenever you like'] },
      { type: 'link', slug: 'rollout-tips' },
    ],
  },
  {
    slug: 'creator-page',
    category: 'promotion',
    title: 'Your creator page and newsletter',
    summary: 'One page at /c/your-handle with all your releases.',
    body: [
      { type: 'p', text: 'Your creator page lives at /c/your-handle. It shows your profile and every release, newest first.' },
      { type: 'p', text: 'Fans can sign up to your newsletter there. Their emails are yours to keep and use.' },
      { type: 'link', slug: 'change-profile' },
    ],
  },
  {
    slug: 'rollout-tips',
    category: 'promotion',
    title: 'Tips for a release rollout',
    summary: 'Upload early, share the link, post clips.',
    body: [
      { type: 'list', items: ['Upload 2 to 4 weeks before release day and schedule it', 'Share your smart link early so fans can pre-save', 'Post clips of the hook in the run-up and after release', 'Email your pre-save list on release day'] },
      { type: 'callout', tone: 'tip', text: 'Different clips of the same song give fans more than one reason to stop scrolling.' },
    ],
  },

  // Money & splits
  {
    slug: 'getting-paid',
    category: 'money',
    title: 'How do I get paid?',
    summary: 'Each platform pays you directly. Unsigned takes 0%.',
    body: [
      { type: 'p', text: 'Because posts go out on your own accounts, each platform pays you through its own creator programme:' },
      { type: 'list', items: ['YouTube Partner Programme', 'TikTok Creator Rewards', 'Facebook monetisation for Pages', 'SoundCloud monetisation'] },
      { type: 'p', text: 'Each programme has its own entry rules. Apply on the platform itself.' },
      { type: 'callout', tone: 'tip', text: 'Unsigned never holds your money and takes 0% of your earnings.' },
    ],
  },
  {
    slug: 'splits',
    category: 'money',
    title: 'How splits work',
    summary: 'A record of who is owed what share of a release.',
    body: [
      { type: 'p', text: 'A split is a record of who is owed what share of a release, such as a producer or a featured artist.' },
      { type: 'list', items: ['Shares must add up to 100%', 'Each collaborator gets a copy by email (simulated in demo mode)', 'You can download a split sheet to sign and keep'] },
      { type: 'callout', tone: 'warning', text: 'Unsigned does not pay collaborators for you. Platforms pay you, and you pay your collaborators.' },
    ],
  },
  {
    slug: 'stats-differ',
    category: 'money',
    title: 'Why are my stats different from the platform’s?',
    summary: 'Platforms count and update at different times.',
    body: [
      { type: 'p', text: 'Each platform counts views and plays in its own way, and some filter out repeat or suspicious views later. Unsigned shows the numbers the platform gives us at the last refresh.' },
      { type: 'p', text: 'For earnings and official totals, the platform’s own dashboard is always the source of truth.' },
      { type: 'link', slug: 'analytics-refresh' },
    ],
  },
  {
    slug: 'analytics-refresh',
    category: 'money',
    title: 'How often do analytics refresh?',
    summary: 'Press Refresh stats to pull the latest numbers.',
    body: [
      { type: 'p', text: 'On the Analytics page, press Refresh stats to fetch the latest numbers from each connected platform. Some platforms only update their own figures every few hours, so a fresh pull may not change much.' },
      { type: 'p', text: 'Smart link visits and pre-saves are counted by Unsigned, so they update straight away.' },
    ],
  },

  // Account & privacy
  {
    slug: 'change-profile',
    category: 'account',
    title: 'Changing your profile',
    summary: 'Edit your name, photo, bio and links in the studio.',
    body: [
      { type: 'p', text: 'Open Profile in the studio to change your display name, photo, bio and links.' },
      { type: 'p', text: 'Your handle sets your page address at /c/your-handle. It can’t be changed in the studio yet; email support if you need a different one.' },
    ],
  },
  {
    slug: 'data-we-store',
    category: 'account',
    title: 'What data does Unsigned store?',
    summary: 'Your account, your releases and what you need to post them.',
    body: [
      { type: 'list', items: ['Your email address and profile', 'Your releases, files, art and credits', 'Access keys for the platforms you connect (never your passwords)', 'Stats for your posts and smart links', 'Pre-save and newsletter emails your fans give you'] },
      { type: 'p', text: 'Fan emails from pre-saves and your newsletter are only shown to you. Ask support if you want to know more about what is stored.' },
    ],
  },
  {
    slug: 'delete-account',
    category: 'account',
    title: 'Deleting your account',
    summary: 'Ask us and we remove your account and releases.',
    body: [
      { type: 'p', text: 'Email support from the address on your account and ask for it to be deleted. We remove your profile, releases, links and fan emails.' },
      { type: 'callout', tone: 'tip', text: 'Export your fan emails first. Once the account is gone they cannot be recovered.' },
      { type: 'p', text: 'Posts on platforms stay on your accounts there.' },
    ],
  },
  {
    slug: 'contact-support',
    category: 'account',
    title: 'Contacting support',
    summary: 'Email us with your handle and what went wrong.',
    body: [
      { type: 'p', text: 'Email us at the address at the bottom of the help centre. Tell us your handle, the release and what you expected to happen.' },
      { type: 'p', text: 'A screenshot of any error message helps us fix things faster.' },
    ],
  },
];

// Shown on the help centre's front page.
export const POPULAR_SLUGS = [
  'unsigned-vs-distributors',
  'getting-paid',
  'cover-art',
  'release-dates',
  'tiktok',
  'why-not-spotify',
  'smart-links',
  'splits',
];

export const findCategory = (id: string | null | undefined) => HELP_CATEGORIES.find((c) => c.id === id);

export const articlesIn = (categoryId: string) => HELP_ARTICLES.filter((a) => a.category === categoryId);

export const findArticle = (slug: string | undefined) => HELP_ARTICLES.find((a) => a.slug === slug);

// All the readable text in an article body, for search.
const bodyText = (body: Block[]) =>
  body
    .map((b) => {
      if (b.type === 'list') return b.items.join(' ');
      if (b.type === 'link') return b.label ?? '';
      return b.text;
    })
    .join(' ');

// Case-insensitive search. Title matches first, then summary, then body.
export function searchArticles(query: string): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { article: HelpArticle; rank: number }[] = [];
  for (const article of HELP_ARTICLES) {
    let rank = -1;
    if (article.title.toLowerCase().includes(q)) rank = 0;
    else if (article.summary.toLowerCase().includes(q)) rank = 1;
    else if (bodyText(article.body).toLowerCase().includes(q)) rank = 2;
    if (rank >= 0) scored.push({ article, rank });
  }
  // Array.sort is stable, so ties keep their reading order.
  return scored.sort((a, b) => a.rank - b.rank).map((s) => s.article);
}
