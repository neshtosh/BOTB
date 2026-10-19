import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import Logo from '../common/Logo';
import { siteConfig } from '../../config/site';
import { useAuth } from '../../context/AuthContext';
import { useClock } from '../../hooks/useClock';
import { scrollToId, startScroll, stopScroll } from '../../hooks/useSmoothScroll';

const EASE = [0.22, 1, 0.36, 1] as const;

// Sections of the landing page.
const sectionLinks = [
  { id: 'how', label: 'How it works' },
  { id: 'platforms', label: 'Platforms' },
  { id: 'faq', label: 'FAQ' },
];

const Navbar: React.FC = () => {
  const { user, profile } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const time = useClock(siteConfig.timeZone);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Freeze the page behind the open menu.
  useEffect(() => {
    if (isMenuOpen) stopScroll();
    else startScroll();
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  const goToSection = (id: string) => {
    setIsMenuOpen(false);
    if (location.pathname === '/') window.setTimeout(() => scrollToId(id), isMenuOpen ? 450 : 0);
    else navigate(`/#${id}`);
  };

  // Big menu entries: page sections, then account destinations.
  const menuItems: { label: string; onClick?: () => void; to?: string }[] = [
    ...sectionLinks.map((s) => ({ label: s.label, onClick: () => goToSection(s.id) })),
    { label: 'Help', to: '/help' },
    ...(user
      ? [
          { label: 'Studio', to: '/dashboard' },
          ...(profile ? [{ label: 'My page', to: `/c/${profile.handle}` }] : []),
        ]
      : [
          { label: 'Log in', to: '/login' },
          { label: 'Start free', to: '/signup' },
        ]),
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-colors duration-500',
          isScrolled && !isMenuOpen ? 'bg-ink/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
        )}
      >
        <div className="container">
          <nav className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" aria-label={`${siteConfig.name} home`}>
              <Logo markClassName="h-8 w-8 sm:h-9 sm:w-9" wordClassName="text-2xl sm:text-[1.7rem]" />
            </Link>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="hidden lg:flex items-center gap-6">
                {sectionLinks.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToSection(s.id)}
                    className="text-sm font-medium text-white/80 hover:text-signal transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
                <Link to="/help" className="text-sm font-medium text-white/80 hover:text-signal transition-colors">
                  Help
                </Link>
              </div>
              <span className="hidden xl:inline font-mono text-[11px] uppercase tracking-[0.08em] text-white/50 tabular-nums">
                {siteConfig.cityCode} {time}
              </span>
              {user ? (
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 bg-signal text-ink px-4 py-2 text-sm font-semibold hover:bg-white transition-colors"
                >
                  Studio <ArrowUpRight size={15} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="hidden sm:inline text-sm font-medium text-white/80 hover:text-signal transition-colors">
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="hidden sm:inline-flex items-center gap-1.5 bg-signal text-ink px-4 py-2 text-sm font-semibold hover:bg-white transition-colors"
                  >
                    Start free <ArrowUpRight size={15} />
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-expanded={isMenuOpen}
                aria-controls="site-menu"
                className={cn('btn-line px-3 py-1.5 sm:px-4 sm:py-2 lg:hidden', isMenuOpen && 'bg-white text-ink')}
              >
                {isMenuOpen ? 'Close' : 'Menu'}
                {isMenuOpen ? <X size={16} /> : <ArrowDown size={16} />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="site-menu"
            className="fixed inset-0 z-40 bg-ink flex flex-col lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="container flex-1 flex flex-col justify-between pt-28 pb-10">
              <ul className="space-y-1">
                {menuItems.map((item, i) => {
                  const className =
                    'group flex items-baseline gap-4 font-display text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.95] tracking-[0.01em] text-white hover:text-signal transition-colors text-left';
                  const label = (
                    <>
                      <span className="font-mono text-xs tracking-normal text-white/40">0{i + 1}</span>
                      {item.label}
                    </>
                  );
                  return (
                    <li key={item.label} className="overflow-hidden">
                      <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.7, delay: 0.15 + i * 0.05, ease: EASE }}
                      >
                        {item.to ? (
                          <Link to={item.to} className={className}>
                            {label}
                          </Link>
                        ) : (
                          <button type="button" onClick={item.onClick} className={className}>
                            {label}
                          </button>
                        )}
                      </motion.div>
                    </li>
                  );
                })}
              </ul>

              <motion.div
                className="flex flex-wrap justify-between gap-6 border-t border-white/10 pt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div>
                  <p className="eyebrow mb-2">Contact</p>
                  <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-signal transition-colors">
                    {siteConfig.contactEmail}
                  </a>
                </div>
                <p className="eyebrow self-end">{siteConfig.slogan}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
