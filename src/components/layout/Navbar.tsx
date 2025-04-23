import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { socialLinks } from '../../data/socialData';
import SocialLinks from '../common/SocialLinks';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/music', label: 'Music' },
    { path: '/videos', label: 'Videos' },
    { path: '/events', label: 'Events' },
    { path: '/about', label: 'About' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-surface-100/85 backdrop-blur-md border-b border-surface-300/30' : 'bg-transparent'
      )}
    >
      <div className="container mx-auto">
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/images/ent.png" 
              alt="Logo" 
              className="h-18 w-14 filter brightness-0 invert"
            />
            <span className="text-xl font-bold tracking-tighter">BOTB</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  isActive(link.path) 
                    ? 'text-primary-400' 
                    : 'text-surface-700 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Social Links (Desktop) */}
          <div className="hidden md:block">
            <SocialLinks links={socialLinks.slice(0, 3)} />
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div 
        className={cn(
          'md:hidden fixed inset-0 bg-surface-100 z-40 transition-transform duration-300 ease-in-out',
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ top: '64px' }}
      >
        <div className="flex flex-col p-6 space-y-6">
          <div className="space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'block text-lg font-medium py-2 transition-colors duration-200',
                  isActive(link.path) 
                    ? 'text-primary-400' 
                    : 'text-surface-700 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="pt-6 border-t border-surface-300/30">
            <p className="text-sm text-surface-600 mb-4">Follow</p>
            <SocialLinks links={socialLinks} variant="filled" iconSize={22} className="flex-wrap" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;