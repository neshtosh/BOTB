import { requireEnv } from '../env.js';
import { fetchJson, form } from '../http.js';
import { expiresIn, type ProviderAdapter } from './types.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface GoogleToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export const youtube: ProviderAdapter = {
  usesPkce: false,

  authorizeUrl({ state, redirectUri }) {
    const params = new URLSearchParams({
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent', // guarantees a refresh token on every connect
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  async connect({ code, redirectUri }) {
    const token = await fetchJson<GoogleToken>(
      TOKEN_URL,
      {
        method: 'POST',
        body: form({
          code,
          client_id: requireEnv('GOOGLE_CLIENT_ID'),
          client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      },
      'Google'
    );

    const channels = await fetchJson<{ items?: { id: string; snippet: { title: string } }[] }>(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${token.access_token}` } },
      'YouTube'
    );
    const channel = channels.items?.[0];
    if (!channel) throw new Error('This Google account has no YouTube channel. Create one first.');

    return {
      accountId: channel.id,
      accountName: channel.snippet.title,
      tokens: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: expiresIn(token.expires_in),
      },
    };
  },

  async refresh(tokens) {
    const token = await fetchJson<GoogleToken>(
      TOKEN_URL,
      {
        method: 'POST',
        body: form({
          client_id: requireEnv('GOOGLE_CLIENT_ID'),
          client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
          refresh_token: tokens.refreshToken ?? '',
          grant_type: 'refresh_token',
        }),
      },
      'Google'
    );
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? tokens.refreshToken,
      expiresAt: expiresIn(token.expires_in),
    };
  },
};
