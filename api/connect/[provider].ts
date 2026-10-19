import { createHash, randomBytes } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { appUrl } from '../_lib/env.js';
import { sendError } from '../_lib/http.js';
import { adapters, isProvider } from '../_lib/providers/index.js';
import { admin, HttpError, requireUser } from '../_lib/supabaseAdmin.js';

// GET /api/connect/:provider -> { url } to send the browser to the platform's consent screen.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed.');
    const provider = req.query.provider;
    if (!isProvider(provider)) throw new HttpError(404, 'Unknown platform.');
    const user = await requireUser(req);
    const adapter = adapters[provider];

    const state = randomBytes(24).toString('base64url');
    const codeVerifier = adapter.usesPkce ? randomBytes(48).toString('base64url') : undefined;
    const codeChallenge = codeVerifier
      ? createHash('sha256').update(codeVerifier).digest('base64url')
      : undefined;

    const db = admin();
    // Clear this user's stale attempts so the table doesn't grow forever.
    await db.from('oauth_states').delete().eq('user_id', user.id);
    const { error } = await db
      .from('oauth_states')
      .insert({ state, user_id: user.id, provider, code_verifier: codeVerifier ?? null });
    if (error) throw new Error(error.message);

    const redirectUri = `${appUrl()}/api/oauth/callback/${provider}`;
    res.status(200).json({ url: adapter.authorizeUrl({ state, redirectUri, codeChallenge }) });
  } catch (err) {
    sendError(res, err);
  }
}
