import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import { inputClass, labelClass, selectClass } from '../../components/dashboard/styles';
import { Notice } from '../../components/dashboard/Studio';
import { ScribbleUnderline, ScrollDoodle } from '../../components/doodles/Doodles';
import { isDemoMode, supabase } from '../../lib/supabase';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../../lib/demo/seed';
import { useAuth } from '../../context/AuthContext';
import { siteConfig } from '../../config/site';
import type { CreatorType } from '../../types/platform';

const creatorTypes: { value: CreatorType; label: string }[] = [
  { value: 'musician', label: 'Musician / Artist' },
  { value: 'video', label: 'Video creator' },
  { value: 'podcaster', label: 'Podcaster' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'other', label: 'Something else' },
];

const AuthPage: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [creatorType, setCreatorType] = useState<CreatorType>('musician');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
        return;
      }

      const cleanHandle = handle.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(cleanHandle)) {
        throw new Error('Handle must be 3–30 characters: lowercase letters, numbers or _.');
      }
      const { data: taken } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', cleanHandle)
        .maybeSingle();
      if (taken) throw new Error('That handle is already taken.');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { handle: cleanHandle, display_name: displayName.trim(), creator_type: creatorType },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      if (data.session) {
        navigate('/dashboard');
      } else {
        setNotice('Check your email to confirm your account, then log in.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="container pt-28 sm:pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto grid w-full max-w-4xl lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]"
      >
        <aside className="paper relative hidden lg:flex flex-col justify-between p-8 overflow-hidden">
          <ScrollDoodle shape={isSignup ? 'crown' : 'sparkle'} color="#0b0b0c" animate={false}
            className="right-6 top-6 h-20 w-20 opacity-60" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/60">
              {isSignup ? 'New here' : 'Creator studio'}
            </p>
            <p className="font-display text-ink text-6xl leading-[0.9] mt-4 max-w-[12ch]">{siteConfig.slogan}</p>
            <ScribbleUnderline variant="wave" animate={false} color="#0b0b0c" className="mt-3 max-w-[14rem]" />
          </div>
          <ol className="mt-10 space-y-3 text-sm text-ink/80">
            {['Upload a track or video once', 'We find the hook and cut the clip', 'Publish to every platform yourself'].map(
              (step, i) => (
                <li key={step} className="flex items-baseline gap-3 border-t border-ink/20 pt-3">
                  <span className="font-mono text-[10px] text-ink/60">{String(i + 1).padStart(2, '0')}</span>
                  {step}
                </li>
              )
            )}
          </ol>
        </aside>

        <div className="relative bg-ink border border-white/15">
          <div className="hazard h-1.5" aria-hidden />
          <div className="p-6 sm:p-8">
            <p className="eyebrow text-white/50 mb-3">{isSignup ? 'Sign up' : 'Log in'}</p>
            <h1 className="text-4xl sm:text-5xl">{isSignup ? 'Create your creator account' : 'Welcome back'}</h1>
            <p className="text-white/55 text-sm mt-3 mb-6">
              {isSignup
                ? `Upload once, publish everywhere with ${siteConfig.name}.`
                : 'Log in to manage and publish your content.'}
            </p>

            {isDemoMode && (
              <div className="mb-6 border border-dashed border-signal/60 bg-signal/5 p-4 text-sm">
                <p className="tag-yellow mb-3">Demo mode</p>
                {isSignup ? (
                  <p className="text-white/70">
                    Accounts are stored only in this browser. Or skip sign-up and{' '}
                    <Link to="/login" className="text-signal underline underline-offset-4">use the demo account</Link>.
                  </p>
                ) : (
                  <>
                    <p className="text-white/70">Log in as the demo creator (Kasi Moto):</p>
                    <dl className="mt-2 grid grid-cols-[5rem_minmax(0,1fr)] gap-y-1 font-mono text-xs">
                      <dt className="text-white/50">Email</dt>
                      <dd className="break-all">{DEMO_EMAIL}</dd>
                      <dt className="text-white/50">Password</dt>
                      <dd className="break-all">{DEMO_PASSWORD}</dd>
                    </dl>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(DEMO_EMAIL);
                        setPassword(DEMO_PASSWORD);
                      }}
                      className="mt-3 bg-signal text-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] hover:bg-white transition-colors"
                    >
                      Fill in demo login
                    </button>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <>
                  <div>
                    <label className={labelClass} htmlFor="displayName">Display name</label>
                    <input id="displayName" className={inputClass} required value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)} placeholder="Your artist or channel name" />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="handle">Handle</label>
                    <div className="flex items-stretch">
                      <span className="grid place-items-center border border-r-0 border-white/20 bg-white/[0.06] px-3 font-mono text-xs text-white/50">
                        /c/
                      </span>
                      <input id="handle" className={inputClass} required value={handle}
                        onChange={(e) => setHandle(e.target.value.toLowerCase())} placeholder="yourname" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="creatorType">I am a</label>
                    <select id="creatorType" className={selectClass} value={creatorType}
                      onChange={(e) => setCreatorType(e.target.value as CreatorType)}>
                      {creatorTypes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className={labelClass} htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" className={inputClass} required
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="password">Password</label>
                <input id="password" type="password" minLength={8} required className={inputClass}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {error && <Notice tone="error">{error}</Notice>}
              {notice && <Notice>{notice}</Notice>}

              <Button type="submit" fullWidth size="lg" isLoading={submitting}>
                {isSignup ? 'Create account' : 'Log in'}
              </Button>
            </form>

            <p className="text-sm text-white/55 mt-6 pt-5 border-t border-white/10 text-center">
              {isSignup ? 'Already have an account? ' : 'New here? '}
              <Link to={isSignup ? '/login' : '/signup'} className="text-signal underline underline-offset-4 hover:text-white">
                {isSignup ? 'Log in' : 'Create an account'}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
