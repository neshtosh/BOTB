import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';
import { cardClass } from '../../components/dashboard/styles';
import { distributionOnly, providers } from '../../config/platforms';
import { useConnections } from '../../hooks/useCreatorData';
import { apiFetch, supabase } from '../../lib/supabase';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Connections</h1>
        <p className="text-surface-600 mt-1">Link the accounts you want to publish to. We never see your passwords.</p>
      </div>

      {(justConnected || callbackError) && (
        <div className={callbackError ? 'text-sm text-error-400' : 'text-sm text-success-400'}>
          {callbackError ?? `Connected ${providers.find((p) => p.id === justConnected)?.name ?? justConnected}.`}{' '}
          <button className="underline text-surface-600" onClick={() => setParams({})}>Dismiss</button>
        </div>
      )}
      {error && <p className="text-sm text-error-400">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const connection = connections.find((c) => c.provider === provider.id);
          const ig = connection?.metadata?.instagramUsername as string | null | undefined;
          return (
            <div key={provider.id} className={`${cardClass} flex flex-col gap-4`}>
              <div>
                <div className="flex items-center gap-2">
                  <h4>{provider.name}</h4>
                  {connection && <CheckCircle2 size={18} className="text-success-400" />}
                </div>
                <p className="text-sm text-surface-600 mt-1">{provider.description}</p>
                {connection && (
                  <p className="text-sm mt-2">
                    Connected as <span className="font-medium">{connection.account_name}</span>
                    {provider.id === 'meta' && (ig ? ` · Instagram @${ig}` : ' · no Instagram linked')}
                  </p>
                )}
              </div>
              <div className="mt-auto flex gap-2">
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
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {distributionOnly.map((d) => (
          <div key={d.name} className={`${cardClass} opacity-70`}>
            <div className="flex items-center gap-2">
              <h4>{d.name}</h4>
              <span className="text-2xs bg-surface-300 rounded-full px-2 py-0.5">Coming soon</span>
            </div>
            <p className="text-sm text-surface-600 mt-1">{d.reason} We're adding distributor support.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Connections;
