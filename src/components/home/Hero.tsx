import React, { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import ScrambleText from '../common/ScrambleText';
import { siteConfig } from '../../config/site';
import { useClock } from '../../hooks/useClock';
import { scrollToId } from '../../hooks/useSmoothScroll';
import { useAuth } from '../../context/AuthContext';

// three.js is heavy; load the 3D performer separately so the page paints first.
const HeroScene = lazy(() => import('./HeroScene'));

const EASE = [0.22, 1, 0.36, 1] as const;
const WORDS_START = 0.5; // seconds before the statement starts revealing

const Hero: React.FC = () => {
  const { hero } = siteConfig;
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const time = useClock(siteConfig.timeZone);
  const { user } = useAuth();

  // Scroll: the copy lifts and fades while the 3D camera moves into the tunnel.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Pointer spotlight: a soft signal-coloured glow that trails the cursor.
  const mx = useSpring(useMotionValue(60), { stiffness: 60, damping: 20 });
  const my = useSpring(useMotionValue(40), { stiffness: 60, damping: 20 });
  const spotlight = useMotionTemplate`radial-gradient(38rem circle at ${mx}% ${my}%, rgba(242,230,0,0.16), transparent 60%)`;
  const onPointerMove = (e: React.PointerEvent) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const words = hero.statement.split(' ');
  // The opening words are set in the brush face and highlighted.
  const highlightLength = hero.highlight.split(' ').length;

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      className="relative h-[100svh] min-h-[620px] overflow-hidden bg-ink text-white"
    >
      {/* 3D graffiti tunnel + performer: reacts to scroll, the cursor and the beat */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, delay: 0.2, ease: EASE }}
      >
        <Suspense fallback={null}>
          <HeroScene progress={scrollYProgress} reduceMotion={Boolean(reduceMotion)} />
        </Suspense>
      </motion.div>

      {/* Torch-like glow that follows the cursor across the graffiti */}
      <motion.div className="absolute inset-0 mix-blend-screen pointer-events-none" style={{ background: spotlight }} />

      {/* Darken only behind the copy (bottom-left) so the graffiti stays visible elsewhere. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_60%_at_15%_85%,rgba(11,11,12,0.85),transparent_70%)]" />

      {/* Copy */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 h-full container flex flex-col justify-end pb-10 sm:pb-14"
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-4xl">
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            >
              <span className="h-2 w-2 bg-signal" />
              <h1 className="eyebrow text-white/80 text-[11px] sm:text-xs font-normal tracking-[0.08em]">
                {siteConfig.name} · {hero.eyebrow}
              </h1>
            </motion.div>

            <p className="text-[clamp(1.7rem,3.6vw,3.5rem)] leading-[1.02] font-medium tracking-[-0.035em]">
              {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em]">
                  <motion.span
                    className={i < highlightLength ? 'inline-block text-signal font-display font-normal tracking-[0.01em]' : 'inline-block'}
                    initial={reduceMotion ? false : { opacity: 0, y: '60%', filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: '0%', filter: 'blur(0px)' }}
                    transition={{ duration: 0.9, delay: WORDS_START + i * 0.045, ease: EASE }}
                  >
                    {word}
                  </motion.span>
                  {i < words.length - 1 && ' '}
                </span>
              ))}
            </p>

            <motion.div
              className="flex flex-wrap gap-3 mt-8 sm:mt-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: WORDS_START + words.length * 0.045 + 0.2, ease: EASE }}
            >
              <Link
                to={user ? '/dashboard/publish' : '/signup'}
                className="group inline-flex items-center gap-3 bg-signal text-ink px-5 py-3 text-sm font-semibold transition-transform duration-300 hover:-translate-y-0.5"
              >
                {user ? 'Open your studio' : 'Start free'}
                <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <button type="button" onClick={() => scrollToId('how')} className="btn-line group py-3 px-5">
                See how it works
                <ArrowDown size={16} className="transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>
            </motion.div>
          </div>

          {/* Meta column */}
          <motion.div
            className="hidden lg:flex flex-col items-end gap-6 text-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <ScrambleText
              text="UPLOAD.CLIP.POST.TRACK"
              delay={1300}
              className="font-mono text-sm tracking-[0.12em] text-signal"
            />
            <dl className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/60 space-y-1.5">
              <div className="flex justify-end gap-6">
                <dt>Platforms</dt>
                <dd className="text-white">05</dd>
              </div>
              <div className="flex justify-end gap-6">
                <dt>{siteConfig.cityCode}</dt>
                <dd className="text-white tabular-nums">{time}</dd>
              </div>
            </dl>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/60">
              Scroll
              <motion.span
                animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowDown size={14} />
              </motion.span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
