import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import Button from '../../components/common/Button';
import { cardClass } from '../../components/dashboard/styles';
import { Notice, PageHeader } from '../../components/dashboard/Studio';
import { distributionOnly, providers } from '../../config/platforms';
import { useConnections } from '../../hooks/useCreatorData';
import { apiFetch, supabase } from '../../lib/supabase';
import { cn } from '../../utils/cn';
import type { Provider } from '../../types/platform';

const Connections: React.FC = () => {
  const { connections, reload } = useConnections();
  const [params, setParams] = useSearchParams();
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState('');

  const justConnected = params.get('connected');
  const callbackError = params.get('error');

  const connect = async (provider: Provider) => {
    setError('');
    setPending(provider);
    try {
      const { url } = await apiFetch<{ url: string }>(`/api/connect/${provider}`);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the connection.');
      setPending(null);
    }
  };

  const disconnect = async (id: string, name: string) => {
    if (!window.confirm(`Disconnect ${name}? You can reconnect any time.`)) return;
    await supabase.from('platform_connections').delete().eq('id', id);
    reload();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Studio / Connections · ${connections.length} of ${providers.length} linked`}
        title="Connections"
        description="Link the accounts you want to publish to. We never see your passwords."
        underline="zigzag"
        doodle="bolt"
      />

      {(justConnected || callbackError) && (
        <Notice tone={callbackError ? 'error' : 'ok'} className="flex flex-wrap items-center gap-x-3">
          <span>
            {callbackError ?? `Connected ${providers.find((p) => p.id === justConnected)?.name ?? justConnected}.`}
          </span>
          <button className="eyebrow text-white/50 hover:text-signal" onClick={() => setParams({})}>
            Dismiss
          </button>
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid sm:grid-cols-2 gap-4">
        {providers.map((provider, i) => {
          const connection = connections.find((c) => c.provider === provider.id);
          const ig = connection?.metadata?.instagramUsername as string | null | undefined;
          return (
            <div
              key={provider.id}
              className={cn(cardClass, 'flex flex-col gap-5', connection && 'border-signal/60')}
            >
              {connection && <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-signal" />}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-[0.1em] text-white/35 mb-2">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <h3 className="break-words">{provider.name}</h3>
                  </div>
                  {connection ? (
                    <span className="tag-yellow gap-1 shrink-0">
                      <Check size={12} strokeWidth={3} /> Connected
                    </span>
                  ) : (
                    <span className="tag shrink-0 !bg-transparent border border-white/20 !text-white/50">Not linked</span>
                  )}
                </div>
                <p className="text-sm text-white/55 mt-3">{provider.description}</p>
                {connection && (
                  <p className="text-sm mt-3 border-t border-white/10 pt-3">
                    <span className="eyebrow text-white/40 mr-2">As</span>
                    <span className="font-medium">{connection.account_name}</span>
                    {provider.id === 'meta' && (
                      <span className="text-white/55">{ig ? ` · Instagram @${ig}` : ' · no Instagram linked'}</span>
                    )}
                  </p>
                )}
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                {connection ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => connect(provider.id)} isLoading={pending === provider.id}>
                      Reconnect
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => disconnect(connection.id, provider.name)}>
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => connect(provider.id)} isLoading={pending === provider.id}>
                    Connect {provider.name}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {distributionOnly.map((d) => (
          <div key={d.name} className="relative border border-dashed border-white/15 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-white/60">{d.name}</h3>
              <span className="tag shrink-0 !bg-white/10 !text-white/60">Coming soon</span>
            </div>
            <p className="text-sm text-white/45 mt-3">{d.reason} We're adding distributor support.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Connections;
