import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  BarChart3,
  Facebook,
  Globe2,
  Instagram,
  KeyRound,
  Mic2,
  Minus,
  Music2,
  Plus,
  Radio,
  Scissors,
  Type,
  Video,
  Youtube,
  Cloud,
  Mail,
} from 'lucide-react';
import Hero from '../components/home/Hero';
import ScrollMarquee from '../components/doodles/ScrollMarquee';
import { ScrollDoodle, SectionTitle } from '../components/doodles/Doodles';
import { CautionTapes, OutlineScroll, PaperPanel } from '../components/theme/Poster';
import { AnalyticsVisual, HookVisual, PlatformsVisual, UploadVisual } from '../components/landing/StepVisuals';
import { ControlRoom, CreatorStrip } from '../components/landing/IndieVisuals';
import { siteConfig } from '../config/site';
import { useAuth } from '../context/AuthContext';
import { scrollToId } from '../hooks/useSmoothScroll';
import { cn } from '../utils/cn';

const EASE = [0.22, 1, 0.36, 1] as const;
const rise = (i = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, delay: i * 0.08, ease: EASE },
});

const STEPS = [
  {
    n: '01',
    title: 'Upload once',
    text: 'Drop in a track or a video and add the title, description and tags one time. No more re-typing the same details into five different apps.',
    points: ['Video: MP4, MOV and more', 'Audio: MP3, WAV and more', 'Saved to your library'],
    visual: <UploadVisual />,
  },
  {
    n: '02',
    title: 'Find the hook',
    text: "Full songs don't belong on TikTok or Reels. Unsigned listens to your track, finds the part that hits hardest and cuts a vertical clip with your cover art. Move it or change the length if you want.",
    points: ['15, 30 or 60 second clips', 'Made in your browser, nothing extra to install', 'Videos can be trimmed the same way'],
    visual: <HookVisual />,
  },
  {
    n: '03',
    title: 'Pick where it goes',
    text: 'Tick the platforms you want. For each one choose the full file or the clip, and write a caption that fits that crowd. Hit publish once.',
    points: ['A separate caption for every platform', 'Post public, or private to review first', 'Everything goes out at the same time'],
    visual: <PlatformsVisual />,
  },
  {
    n: '04',
    title: 'Watch it land',
    text: 'Views, likes, comments and shares from every platform come back into one page, so you can see what is working without opening five apps.',
    points: ['Per-post and per-platform numbers', 'Refresh whenever you want', 'Links straight to every live post'],
    visual: <AnalyticsVisual />,
  },
];

const INDIE_POINTS = [
  { title: 'Release', text: 'Singles, EPs, videos and episodes, out on your schedule.' },
  { title: 'Promote', text: 'A clip of the hook and a caption for every platform.' },
  { title: 'Grow your fans', text: 'Fans join your list from your page. You keep that list.' },
  { title: 'Read the numbers', text: 'See what is working across every platform in one place.' },
];

const PLATFORMS = [
  { name: 'YouTube', icon: Youtube, gets: 'Videos and Shorts' },
  { name: 'TikTok', icon: Music2, gets: 'Videos and song clips' },
  { name: 'Instagram', icon: Instagram, gets: 'Reels' },
  { name: 'Facebook', icon: Facebook, gets: 'Page videos' },
  { name: 'SoundCloud', icon: Cloud, gets: 'Full tracks' },
];

const FEATURES = [
  { icon: Scissors, title: 'Clip maker', text: 'Finds the hook in a song and turns it into a vertical video for socials.' },
  { icon: Type, title: 'Captions per platform', text: 'One upload, a different caption for each audience.' },
  { icon: BarChart3, title: 'Analytics in one place', text: 'Every view, like, comment and share, side by side.' },
  { icon: Globe2, title: 'Your own page', text: 'A public creator page at unsigned/c/yourname with everything you post.' },
  { icon: Mail, title: 'Fan mailing list', text: 'Fans sign up on your page. The list is yours, not an algorithm’s.' },
  { icon: KeyRound, title: 'No passwords shared', text: 'You connect accounts with the platforms’ own sign-in. We never see your passwords.' },
];

const AUDIENCES = [
  { icon: Mic2, title: 'Independent artists', text: 'Full track on SoundCloud, the hook on TikTok, Reels and Shorts — from one upload.' },
  { icon: Video, title: 'Video creators', text: 'Post the full video to YouTube and Facebook and a trimmed cut to TikTok and Reels.' },
  { icon: Radio, title: 'Podcasters', text: 'Share the episode and clip the best moment for socials without an editor.' },
];

const FAQS = [
  {
    q: 'Do I need a label or a manager?',
    a: 'No. Unsigned is built for people who run their own releases. You upload, you choose where it goes, you see the numbers and you keep your fan list.',
  },
  {
    q: 'How is this different from a distributor?',
    a: 'A distributor delivers your music to stores and passes royalties on to you. Unsigned posts to your own accounts instead, so each platform pays you directly and we take 0%.',
  },
  {
    q: 'How much does it cost?',
    a: 'Unsigned is free while it is in early access. Paid plans will come later; you will be told well before anything changes.',
  },
  {
    q: 'Which platforms can I post to?',
    a: 'YouTube, TikTok, Instagram (Reels), Facebook Pages and SoundCloud. Instagram needs a Business or Creator account linked to a Facebook Page.',
  },
  {
    q: 'Why not Spotify or Apple Music?',
    a: 'They only accept music through distributors, not direct uploads from apps. We are working on a distributor connection so releases can go there too.',
  },
  {
    q: 'How do I get paid?',
    a: 'Through each platform’s own creator programme, such as the YouTube Partner Programme or TikTok Creator Rewards. Unsigned never holds your money.',
  },
  {
    q: 'Do you get my passwords?',
    a: 'No. You connect each account through that platform’s own sign-in page, and you can disconnect at any time. The access keys are stored on our server and never sent to your browser.',
  },
  {
    q: 'Will it post a full song to TikTok or Instagram?',
    a: 'No. For songs, social platforms get a 15, 30 or 60 second clip of the hook, which you can move. The full track goes where full tracks belong, like SoundCloud.',
  },
  {
    q: 'Can I schedule a release?',
    a: 'Yes. Post as soon as possible, or pick a date and time and it goes out within a few minutes of it. Every release also gets a smart link that collects pre-saves before release day.',
  },
  {
    q: 'Are my posts public straight away?',
    a: 'You choose: public, or private so you can check each post first. TikTok is the exception for now: posts stay private (only you can see them) until TikTok has approved our app.',
  },
];

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="text-lg sm:text-xl font-semibold tracking-[-0.02em]">{q}</span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink">
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-6 max-w-2xl text-ink/80">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const { hash } = useLocation();
  const startLink = user ? '/dashboard/publish' : '/signup';

  // Arriving from another page via /#section.
  useEffect(() => {
    if (hash) window.setTimeout(() => scrollToId(hash.slice(1)), 150);
  }, [hash]);

  return (
    <div className="overflow-x-clip">
      <Hero />

      <ScrollMarquee
        items={['No label', 'No manager', 'No middleman', 'YouTube', 'TikTok', 'Instagram', 'Facebook', 'SoundCloud', 'Be your own label']}
        className="bg-signal text-ink -mt-6 relative z-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
      />

      {/* Be your own label */}
      <section id="indie" className="relative py-20 sm:py-28">
        <ScrollDoodle shape="crown" className="hidden sm:block left-[44%] top-14 w-16 h-16" spin={-15} />
        <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionTitle eyebrow="Independent by design" underline="loop" titleClassName="text-[2.6rem] leading-none sm:text-7xl" className="mb-6">
              No label. No problem.
            </SectionTitle>
            <p className="text-lg text-white/75 max-w-lg">
              Labels used to be the only way to get a release out everywhere, cut the promo and read the numbers.
              Unsigned puts that whole desk in your hands, so you can run it yourself.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {INDIE_POINTS.map(({ title, text }, i) => (
                <motion.li key={title} {...rise(i)} className="border-l-2 border-signal pl-4">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-white/60">{text}</p>
                </motion.li>
              ))}
            </ul>
          </div>
          <motion.div {...rise(1)} className="lg:rotate-1">
            <ControlRoom />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative py-20 sm:py-28 scroll-mt-20">
        <OutlineScroll text="How it works" className="absolute inset-x-0 top-4 opacity-25" />
        <div className="container relative">
          <SectionTitle eyebrow="How it works" underline="wave" titleClassName="text-[2.6rem] leading-none sm:text-7xl" className="mb-4">
            Four steps. One upload.
          </SectionTitle>
          <p className="max-w-xl text-white/70 mb-16">
            From the file on your laptop to live posts on every platform, in about the time it takes to post to one.
          </p>

          <div className="space-y-24 sm:space-y-32">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <ScrollDoodle
                  shape={(['arrow', 'sparkle', 'bolt', 'waveform'] as const)[i]}
                  className={cn('hidden md:block w-20 h-20 -top-10', i % 2 ? 'left-[46%]' : 'right-[46%]')}
                  spin={20}
                />
                <motion.div {...rise()} className={cn(i % 2 === 1 && 'lg:order-2')}>
                  <p className="font-sans font-black text-signal text-7xl sm:text-8xl leading-none tracking-[-0.06em]">{step.n}</p>
                  <h3 className="mt-3 text-4xl sm:text-5xl">{step.title}</h3>
                  <p className="mt-4 text-lg text-white/75 max-w-lg">{step.text}</p>
                  <ul className="mt-6 space-y-2">
                    {step.points.map((p) => (
                      <li key={p} className="flex items-center gap-3 text-white/80">
                        <span className="h-1.5 w-4 bg-signal" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </motion.div>
                <motion.div {...rise(1)} className={cn(i % 2 === 1 && 'lg:order-1')}>
                  {step.visual}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms on torn paper */}
      <PaperPanel seed={21} tilt={1.2} innerClassName="py-16 sm:py-24">
        <div id="platforms" className="container relative scroll-mt-28">
          <ScrollDoodle shape="spiral" className="hidden sm:block right-[8%] -top-4 w-20 h-20" color="#0b0b0c" spin={40} />
          <SectionTitle tone="dark" eyebrow="Platforms" underline="zigzag" titleClassName="text-[2.6rem] leading-none sm:text-7xl" className="mb-10">
            Post everywhere
          </SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {PLATFORMS.map(({ name, icon: Icon, gets }, i) => (
              <motion.div key={name} {...rise(i)} className="bg-ink text-white p-5 hover:-rotate-2 transition-transform">
                <Icon size={28} className="text-signal" />
                <p className="mt-6 text-xl font-bold tracking-[-0.03em]">{name}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white/50">{gets}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-ink/80">
            <span className="font-semibold">Spotify &amp; Apple Music:</span> these only take music from distributors, so they
            are not one-click yet. Distributor support is on the way.
          </p>
        </div>
      </PaperPanel>

      {/* Features */}
      <section className="relative py-20 sm:py-28">
        <div className="container">
          <SectionTitle eyebrow="What you get" underline="loop" titleClassName="text-[2.6rem] leading-none sm:text-7xl" className="mb-12">
            Built for creators
          </SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <motion.div key={title} {...rise(i % 3)} className="group bg-ink p-7 sm:p-8 hover:bg-[#141414] transition-colors">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-signal text-signal transition-colors group-hover:bg-signal group-hover:text-ink">
                  <Icon size={20} />
                </span>
                <h3 className="mt-6 text-3xl">{title}</h3>
                <p className="mt-2 text-white/65">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="relative pb-20 sm:pb-28">
        <OutlineScroll text="Independents" reverse className="absolute inset-x-0 top-0 opacity-25" />
        <div className="container relative">
          <SectionTitle eyebrow="Who it's for" underline="double" titleClassName="text-[2.6rem] leading-none sm:text-7xl" className="mb-12">
            Made for independents
          </SectionTitle>
          <div className="grid md:grid-cols-3 gap-5">
            {AUDIENCES.map(({ icon: Icon, title, text }, i) => (
              <motion.div
                key={title}
                {...rise(i)}
                className={cn('paper p-7 sm:p-8', i === 0 && '-rotate-1', i === 1 && 'rotate-1 md:translate-y-6', i === 2 && '-rotate-1')}
              >
                <Icon size={30} />
                <h3 className="mt-8 text-4xl text-ink">{title}</h3>
                <p className="mt-3 text-ink/80">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-20 sm:mt-24">
          <div className="container flex flex-wrap items-end justify-between gap-4 mb-8">
            <p className="font-display text-4xl sm:text-5xl">People running it themselves</p>
            <span className="tag-yellow">Example creators · fictional</span>
          </div>
          <CreatorStrip />
        </div>
      </section>

      {/* FAQ */}
      <PaperPanel seed={33} tilt={0.8} innerClassName="py-16 sm:py-24">
        <div id="faq" className="container relative scroll-mt-28 grid lg:grid-cols-[1fr_1.6fr] gap-10">
          <div>
            <SectionTitle tone="dark" eyebrow="FAQ" underline="slash" titleClassName="text-[2.6rem] leading-none sm:text-7xl">
              Good questions
            </SectionTitle>
            <p className="mt-6 text-ink/80 max-w-xs">
              Something else? Email{' '}
              <a href={`mailto:${siteConfig.contactEmail}`} className="font-semibold underline underline-offset-4">
                {siteConfig.contactEmail}
              </a>
              .
            </p>
          </div>
          <div className="border-t border-ink/20">
            {FAQS.map((f) => (
              <FaqItem key={f.q} {...f} />
            ))}
            <Link
              to="/help"
              className="mt-6 inline-flex items-center gap-1.5 font-semibold underline underline-offset-4 hover:no-underline"
            >
              Visit the help centre →
            </Link>
          </div>
        </div>
      </PaperPanel>

      {/* Final call to action */}
      <CautionTapes text="Be your own label ✦" className="h-[200px] sm:h-[280px]" />
      <section className="relative pb-24 sm:pb-32 -mt-2 text-center">
        <ScrollDoodle shape="heart" className="left-[10%] top-0 w-12 h-12" color="#ffffff" spin={20} />
        <ScrollDoodle shape="crown" className="right-[10%] top-6 w-14 h-14" spin={-15} />
        <div className="container">
          <motion.h2 {...rise()} className="text-6xl sm:text-8xl">
            Release it <span className="text-signal">yourself.</span>
          </motion.h2>
          <motion.p {...rise(1)} className="mt-5 text-lg text-white/70 max-w-lg mx-auto">
            Create your account, connect your platforms and publish your first upload in a few minutes.
          </motion.p>
          <motion.div {...rise(2)} className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to={startLink} className="inline-flex items-center gap-2 bg-signal text-ink px-6 py-3.5 font-semibold hover:bg-white transition-colors">
              {user ? 'Open your studio' : 'Start free'} <ArrowUpRight size={18} />
            </Link>
            {!user && (
              <Link to="/login" className="btn-line py-3.5 px-6">
                Log in
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
