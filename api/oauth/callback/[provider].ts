import type { VercelRequest, VercelResponse } from '@vercel/node';
import { appUrl } from '../../_lib/env.js';
import { adapters, isProvider } from '../../_lib/providers/index.js';
import { admin } from '../../_lib/supabaseAdmin.js';
import { saveTokens } from '../../_lib/tokens.js';

const STATE_TTL_MS = 15 * 60 * 1000;

// The platform redirects here after the creator approves (or denies) access.
// Always ends with a redirect back to the dashboard carrying the outcome.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const back = (params: Record<string, string>) =>
    res.redirect(302, `${appUrl()}/dashboard/connections?${new URLSearchParams(params)}`);

  const provider = req.query.provider;
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';

  try {
    if (!isProvider(provider)) return back({ error: 'Unknown platform.' });
    if (req.query.error) {
      return back({ error: String(req.query.error_description ?? req.query.error) });
    }
    if (!code || !state) return back({ error: 'The platform did not return an authorization code.' });

    const db = admin();
    const { data: saved } = await db
      .from('oauth_states')
      .delete()
      .eq('state', state)
      .eq('provider', provider)
      .select()
      .maybeSingle();
    if (!saved || Date.now() - new Date(saved.created_at).getTime() > STATE_TTL_MS) {
      return back({ error: 'This connection link expired. Please try again.' });
    }

    const account = await adapters[provider].connect({
      code,
      redirectUri: `${appUrl()}/api/oauth/callback/${provider}`,
      codeVerifier: saved.code_verifier ?? undefined,
    });

    const { data: connection, error } = await db
      .from('platform_connections')
      .upsert(
        {
          user_id: saved.user_id,
          provider,
          account_id: account.accountId,
          account_name: account.accountName,
          metadata: account.metadata ?? {},
        },
        { onConflict: 'user_id,provider' }
      )
      .select('id')
      .single();
    if (error || !connection) throw new Error(error?.message ?? 'Could not save the connection.');

    await saveTokens(connection.id, account.tokens);
    return back({ connected: provider });
  } catch (err) {
    console.error(err);
    return back({ error: err instanceof Error ? err.message : 'Connection failed.' });
  }
}
