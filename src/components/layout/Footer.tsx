import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import SocialLinks from '../common/SocialLinks';
import Button from '../common/Button';
import { socialLinks } from '../../data/socialData';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle the newsletter subscription
    console.log('Subscribing email:', email);
    setEmail('');
    // Add your newsletter subscription logic here
  };

  return (
    <footer className="bg-surface-50 border-t border-surface-300/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img 
                src="/images/ent.png" 
                alt="Logo" 
                className="h-8 w-auto filter brightness-0 invert"
              />
              <span className="text-xl font-bold tracking-tighter">ARTISTNAME</span>
            </Link>
            <p className="text-sm text-surface-600 max-w-xs">
              Creating music that blends electronic beats with soulful melodies, pushing the boundaries of modern sound.
            </p>
            <SocialLinks links={socialLinks} variant="outlined" />
          </div>

          {/* Links Column */}
          <div className="md:ml-auto">
            <h4 className="font-medium text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/music" className="text-sm text-surface-600 hover:text-primary-400 transition-colors">
                  Music
                </Link>
              </li>
              <li>
                <Link to="/videos" className="text-sm text-surface-600 hover:text-primary-400 transition-colors">
                  Videos
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-sm text-surface-600 hover:text-primary-400 transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-surface-600 hover:text-primary-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <a 
                  href="/press-kit.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-surface-600 hover:text-primary-400 transition-colors"
                >
                  Press Kit
                </a>
              </li>
              <li>
                <a 
                  href="mailto:contact@artistname.com" 
                  className="text-sm text-surface-600 hover:text-primary-400 transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="font-medium text-lg mb-4">Stay Updated</h4>
            <p className="text-sm text-surface-600 mb-4">
              Subscribe to get the latest updates on releases, events, and exclusive content.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address" 
                  required
                  className="w-full bg-surface-200 border border-surface-400 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <Button 
                type="submit" 
                fullWidth 
                leftIcon={<Mail size={16} />}
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-surface-300/30 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-surface-600">
            &copy; {new Date().getFullYear()} ARTISTNAME. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a 
              href="/privacy-policy" 
              className="text-xs text-surface-600 hover:text-primary-400 transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms-of-service" 
              className="text-xs text-surface-600 hover:text-primary-400 transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;