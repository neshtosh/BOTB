import { requireEnv } from '../env.js';
import { fetchJson, form } from '../http.js';
import { expiresIn, type ProviderAdapter, type TokenSet } from './types.js';

const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';

interface TikTokToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
}

async function requestToken(params: Record<string, string>) {
  return fetchJson<TikTokToken>(
    TOKEN_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form({
        client_key: requireEnv('TIKTOK_CLIENT_KEY'),
        client_secret: requireEnv('TIKTOK_CLIENT_SECRET'),
        ...params,
      }),
    },
    'TikTok'
  );
}

const toTokens = (t: TikTokToken): TokenSet => ({
  accessToken: t.access_token,
  refreshToken: t.refresh_token,
  expiresAt: expiresIn(t.expires_in),
});

export const tiktok: ProviderAdapter = {
  usesPkce: false,

  authorizeUrl({ state, redirectUri }) {
    const params = new URLSearchParams({
      client_key: requireEnv('TIKTOK_CLIENT_KEY'),
      redirect_uri: redirectUri,
      response_type: 'code',
      // video.list is needed to read view/like counts for analytics.
      scope: 'user.info.basic,video.publish,video.list',
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  },

  async connect({ code, redirectUri }) {
    const token = await requestToken({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    const info = await fetchJson<{ data: { user: { open_id: string; display_name: string } } }>(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name',
      { headers: { Authorization: `Bearer ${token.access_token}` } },
      'TikTok'
    );
    return {
      accountId: token.open_id,
      accountName: info.data.user.display_name,
      tokens: toTokens(token),
    };
  },

  async refresh(tokens) {
    return toTokens(
      await requestToken({ grant_type: 'refresh_token', refresh_token: tokens.refreshToken ?? '' })
    );
  },
};
