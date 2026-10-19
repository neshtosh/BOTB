import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import { inputClass, labelClass } from '../../components/dashboard/styles';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
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
    <div className="container section pt-28 pb-20 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-2xl p-8 w-full max-w-md"
      >
        <h1 className="text-2xl sm:text-3xl mb-2">{isSignup ? 'Create your creator account' : 'Welcome back'}</h1>
        <p className="text-surface-600 text-sm mb-6">
          {isSignup
            ? `Upload once, publish everywhere with ${siteConfig.name}.`
            : 'Log in to manage and publish your content.'}
        </p>

        {!isSupabaseConfigured && (
          <p className="text-sm text-warning-400 mb-4">
            Accounts aren't configured yet: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <div>
                <label className={labelClass} htmlFor="displayName">Display name</label>
                <input id="displayName" className={inputClass} required value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)} placeholder="Your artist or channel name" />
              </div>
              <div>
                <label className={labelClass} htmlFor="handle">Handle</label>
                <div className="flex items-center gap-2">
                  <span className="text-surface-600 text-sm">/c/</span>
                  <input id="handle" className={inputClass} required value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase())} placeholder="yourname" />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="creatorType">I am a</label>
                <select id="creatorType" className={inputClass} value={creatorType}
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

          {error && <p className="text-sm text-error-400">{error}</p>}
          {notice && <p className="text-sm text-success-400">{notice}</p>}

          <Button type="submit" fullWidth size="lg" isLoading={submitting} disabled={!isSupabaseConfigured}>
            {isSignup ? 'Create account' : 'Log in'}
          </Button>
        </form>

        <p className="text-sm text-surface-600 mt-6 text-center">
          {isSignup ? 'Already have an account? ' : 'New here? '}
          <Link to={isSignup ? '/login' : '/signup'} className="text-primary-400 hover:text-primary-300">
            {isSignup ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
