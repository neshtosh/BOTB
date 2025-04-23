import React from 'react';
import { cn } from '../../utils/cn';

interface ExplicitBadgeProps {
  className?: string;
}

const ExplicitBadge: React.FC<ExplicitBadgeProps> = ({ className }) => {
  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center text-2xs font-medium',
        'rounded bg-surface-600 text-white px-1 py-0.5 leading-none',
        className
      )}
      title="Explicit"
      aria-label="Explicit content"
    >
      E
    </span>
  );
};

export default ExplicitBadge;