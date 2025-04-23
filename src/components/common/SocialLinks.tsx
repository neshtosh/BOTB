import React from 'react';
import { AlignJustify as Spotify, Music, Youtube, Instagram, Twitter, Music2 } from 'lucide-react';
import { SocialLink } from '../../types';
import { cn } from '../../utils/cn';

interface SocialLinksProps {
  links: SocialLink[];
  className?: string;
  iconSize?: number;
  variant?: 'default' | 'filled' | 'outlined';
}

const SocialLinks: React.FC<SocialLinksProps> = ({ 
  links, 
  className,
  iconSize = 20,
  variant = 'default'
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Spotify':
        return <Spotify size={iconSize} />;
      case 'Music':
        return <Music size={iconSize} />;
      case 'Youtube':
        return <Youtube size={iconSize} />;
      case 'Instagram':
        return <Instagram size={iconSize} />;
      case 'Twitter':
        return <Twitter size={iconSize} />;
      case 'Music2':
        return <Music2 size={iconSize} />;
      default:
        return <Music size={iconSize} />;
    }
  };

  const baseClasses = 'flex items-center justify-center transition-all duration-200';
  
  const variantClasses = {
    default: 'text-surface-600 hover:text-white',
    filled: 'bg-surface-300 hover:bg-surface-400 rounded-full p-2',
    outlined: 'border border-surface-500 hover:border-white rounded-full p-2 hover:bg-surface-300'
  };

  return (
    <div className={cn('flex gap-4', className)}>
      {links.map((link) => (
        <a 
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            baseClasses,
            variantClasses[variant]
          )}
          aria-label={`Follow on ${link.platform}`}
        >
          {getIcon(link.icon)}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;