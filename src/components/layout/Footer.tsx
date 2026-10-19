import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import SocialLinks from '../common/SocialLinks';
import Button from '../common/Button';
import Logo from '../common/Logo';
import { socialLinks } from '../../data/socialData';
import { siteConfig } from '../../config/site';
import { useNewsletter } from '../../hooks/useNewsletter';
import { useAuth } from '../../context/AuthContext';
import { ScrollWordmark } from '../doodles/Doodles';

const linkClass = 'text-sm text-white/60 hover:text-signal transition-colors';
const headingClass = 'font-mono text-[11px] uppercase tracking-[0.1em] text-signal mb-4';

const Footer: React.FC = () => {
  const { user, profile } = useAuth();
  const { email, setEmail, status, message, subscribe } = useNewsletter();

  return (
    <footer className="bg-ink border-t-4 border-signal overflow-x-clip">
      <div className="container py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1 space-y-5">
            <Link to="/" aria-label={`${siteConfig.name} home`}>
              <Logo />
            </Link>
            <p className="text-sm text-white/60 max-w-xs">{siteConfig.description}</p>
            <SocialLinks links={socialLinks} variant="outlined" />
          </div>

          <div>
            <h4 className={headingClass}>01. Product</h4>
            <ul className="space-y-3">
              <li><Link to="/#how" className={linkClass}>How it works</Link></li>
              <li><Link to="/#platforms" className={linkClass}>Platforms</Link></li>
              <li><Link to="/#faq" className={linkClass}>FAQ</Link></li>
              <li><Link to="/help" className={linkClass}>Help</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={headingClass}>02. Account</h4>
            <ul className="space-y-3">
              {user ? (
                <>
                  <li><Link to="/dashboard" className={linkClass}>Studio</Link></li>
                  {profile && <li><Link to={`/c/${profile.handle}`} className={linkClass}>My page</Link></li>}
                  <li><Link to="/dashboard/connections" className={linkClass}>Connections</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/signup" className={linkClass}>Start free</Link></li>
                  <li><Link to="/login" className={linkClass}>Log in</Link></li>
                </>
              )}
              <li><a href={`mailto:${siteConfig.contactEmail}`} className={linkClass}>Contact</a></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className={headingClass}>03. Product updates</h4>
            <p className="text-sm text-white/60 mb-4">New platforms and features, roughly once a month.</p>
            <form onSubmit={subscribe} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                aria-label="Email address"
                className="w-full bg-transparent border border-signal/60 px-4 py-2.5 text-sm placeholder:text-white/40 focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal"
              />
              <Button type="submit" fullWidth className="rounded-none" isLoading={status === 'loading'} leftIcon={<Mail size={16} />}>
                Subscribe
              </Button>
              {message && <p className={status === 'error' ? 'text-xs text-error-400' : 'text-xs text-signal'}>{message}</p>}
            </form>
          </div>
        </div>

        <ScrollWordmark text="Be your own label" className="mt-14 -mx-1 text-signal" />

        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="/privacy-policy.html" className="text-xs text-white/50 hover:text-signal transition-colors">
              Privacy Policy
            </a>
            <a href="/terms-of-service.html" className="text-xs text-white/50 hover:text-signal transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
