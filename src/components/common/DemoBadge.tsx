import React, { useEffect, useState } from 'react';
import { FlaskConical, RotateCcw, X } from 'lucide-react';
import { isDemoMode, resetDemo } from '../../lib/supabase';
import { ensureSeedMedia } from '../../lib/demo/seed';

// Small floating notice so nobody mistakes demo data for the real thing.
const DemoBadge: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isDemoMode) ensureSeedMedia();
  }, []);

  if (!isDemoMode) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[80] font-sans">
      {open ? (
        <div className="w-72 bg-ink border border-signal/60 p-4 shadow-2xl text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-signal">Demo mode</p>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-white/50 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <p className="mt-2 text-white/70">
            No backend is connected. Accounts, uploads and posts are simulated and stay in this browser.
          </p>
          <button
            onClick={() => window.confirm('Reset all demo data in this browser?') && resetDemo()}
            className="mt-3 inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-xs hover:border-signal hover:text-signal"
          >
            <RotateCcw size={12} /> Reset demo data
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-signal text-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] shadow-lg hover:bg-white"
        >
          <FlaskConical size={12} /> Demo mode
        </button>
      )}
    </div>
  );
};

export default DemoBadge;
