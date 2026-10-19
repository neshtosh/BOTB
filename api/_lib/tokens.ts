import { adapters } from './providers/index.js';
import type { Provider, TokenSet } from './providers/types.js';
import { admin } from './supabaseAdmin.js';

export async function saveTokens(connectionId: string, tokens: TokenSet) {
  const { error } = await admin()
    .from('platform_tokens')
    .upsert({
      connection_id: connectionId,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken ?? null,
      expires_at: tokens.expiresAt?.toISOString() ?? null,
      extra: tokens.extra ?? {},
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(`Could not save tokens: ${error.message}`);
}

// Returns a usable token for the connection, refreshing it first if it is
// about to expire.
export async function getValidTokens(connectionId: string, provider: Provider): Promise<TokenSet> {
  const { data, error } = await admin()
    .from('platform_tokens')
    .select('*')
    .eq('connection_id', connectionId)
    .single();
  if (error || !data) throw new Error('Platform connection is missing its tokens. Reconnect it.');

  const tokens: TokenSet = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    extra: data.extra ?? {},
  };

  const adapter = adapters[provider];
  const expiringSoon = tokens.expiresAt && tokens.expiresAt.getTime() < Date.now() + 2 * 60 * 1000;
  if (!expiringSoon || !adapter.refresh) return tokens;

  if (!tokens.refreshToken) throw new Error('Platform login expired. Reconnect the account.');
  const refreshed = { ...(await adapter.refresh(tokens)), extra: tokens.extra };
  await saveTokens(connectionId, refreshed);
  return refreshed;
}
