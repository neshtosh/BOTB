import { requireEnv } from '../env.js';
import { fetchJson, form } from '../http.js';
import { expiresIn, type ProviderAdapter, type TokenSet } from './types.js';

const TOKEN_URL = 'https://secure.soundcloud.com/oauth/token';

interface SoundCloudToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function requestToken(params: Record<string, string>) {
  return fetchJson<SoundCloudToken>(
    TOKEN_URL,
    {
      method: 'POST',
      headers: { Accept: 'application/json; charset=utf-8' },
      body: form({
        client_id: requireEnv('SOUNDCLOUD_CLIENT_ID'),
        client_secret: requireEnv('SOUNDCLOUD_CLIENT_SECRET'),
        ...params,
      }),
    },
    'SoundCloud'
  );
}

const toTokens = (t: SoundCloudToken): TokenSet => ({
  accessToken: t.access_token,
  refreshToken: t.refresh_token,
  expiresAt: expiresIn(t.expires_in),
});

// SoundCloud requires OAuth 2.1 with PKCE.
export const soundcloud: ProviderAdapter = {
  usesPkce: true,

  authorizeUrl({ state, redirectUri, codeChallenge }) {
    const params = new URLSearchParams({
      client_id: requireEnv('SOUNDCLOUD_CLIENT_ID'),
      redirect_uri: redirectUri,
      response_type: 'code',
      code_challenge: codeChallenge ?? '',
      code_challenge_method: 'S256',
      state,
    });
    return `https://secure.soundcloud.com/authorize?${params}`;
  },

  async connect({ code, redirectUri, codeVerifier }) {
    const token = await requestToken({
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier ?? '',
      code,
    });
    const me = await fetchJson<{ id: number; username: string }>(
      'https://api.soundcloud.com/me',
      { headers: { Authorization: `OAuth ${token.access_token}`, Accept: 'application/json' } },
      'SoundCloud'
    );
    return { accountId: String(me.id), accountName: me.username, tokens: toTokens(token) };
  },

  async refresh(tokens) {
    return toTokens(
      await requestToken({ grant_type: 'refresh_token', refresh_token: tokens.refreshToken ?? '' })
    );
  },
};
