import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button';
import { inputClass, labelClass } from '../../components/dashboard/styles';
import { LogoMark } from '../../components/common/Logo';
import { providers } from '../../config/platforms';
import { useAuth } from '../../context/AuthContext';
import { isDemoMode, supabase } from '../../lib/supabase';
import type { Provider } from '../../types/platform';

const SCOPES: Record<Provider, string[]> = {
  youtube: ['Upload videos to your channel', 'See your channel name', 'Read view and like counts'],
  tiktok: ['Post videos to your account', 'See your display name', 'Read video stats'],
  meta: ['Post videos to your Facebook Page', 'Publish Reels to the linked Instagram account', 'Read post insights'],
  soundcloud: ['Upload tracks to your profile', 'See your username', 'Read play counts'],
};

// Demo stand-in for each platform's OAuth consent screen.
const DemoConnect: React.FC = () => {
  const { provider } = useParams<{ provider: Provider }>();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const info = providers.find((p) => p.id === provider);
  const [account, setAccount] = useState('');
  const [hasInstagram, setHasInstagram] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!isDemoMode || !info || !provider) return <Navigate to="/dashboard/connections" replace />;
  if (!loading && !user) return <Navigate to="/login" replace />;

  const accountName = account || profile?.display_name || 'My account';

  const allow = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('platform_connections').upsert(
      {
        user_id: user.id,
        provider,
        account_name: provider === 'soundcloud' ? (profile?.handle ?? accountName) : accountName,
        account_id: `demo-${provider}-${user.id.slice(0, 6)}`,
        metadata: provider === 'meta' ? { pageName: accountName, instagramUsername: hasInstagram ? profile?.handle : null, hasInstagram } : {},
      },
      { onConflict: 'user_id,provider' }
    );
    navigate(`/dashboard/connections?connected=${provider}`);
  };

  const deny = () => navigate(`/dashboard/connections?error=${encodeURIComponent(`You cancelled connecting ${info.name}.`)}`);

  return (
    <div className="container section pt-28 pb-24 flex justify-center">
      <div className="w-full max-w-md bg-white text-ink shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <span className="font-bold tracking-[-0.03em]">{info.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/50">Demo sign-in</span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <LogoMark className="h-11 w-11" />
            <div>
              <p className="font-semibold">Unsigned wants access to your {info.name} account</p>
              <p className="text-sm text-ink/60">Signed in as {user?.email}</p>
            </div>
          </div>

          <ul className="space-y-2 mb-6">
            {SCOPES[provider].map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm">
                <Check size={16} className="mt-0.5 text-green-600 shrink-0" />
                {s}
              </li>
            ))}
          </ul>

          <div className="space-y-4 mb-6">
            <div>
              <label className={`${labelClass} !text-ink/70`} htmlFor="account">
                {provider === 'meta' ? 'Facebook Page' : 'Account name'}
              </label>
              <input
                id="account"
                className={`${inputClass} !bg-ink/5 !border-ink/20 !text-ink`}
                placeholder={profile?.display_name ?? 'My account'}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />
            </div>
            {provider === 'meta' && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={hasInstagram} onChange={(e) => setHasInstagram(e.target.checked)} />
                An Instagram Business account is linked to this Page
              </label>
            )}
          </div>

          <p className="flex items-start gap-2 text-xs text-ink/60 mb-6">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            Demo mode: nothing is sent to {info.name}. In live mode this is {info.name}'s real sign-in page.
          </p>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1 !text-ink border border-ink/20 hover:!bg-ink/5" onClick={deny}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={allow} isLoading={saving}>
              Allow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoConnect;
