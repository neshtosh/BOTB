import { graphVersion, requireEnv } from '../env.js';
import { fetchJson } from '../http.js';
import type { ProviderAdapter } from './types.js';

const graph = (path: string, params: Record<string, string>) =>
  `https://graph.facebook.com/${graphVersion()}/${path}?${new URLSearchParams(params)}`;

interface Page {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string };
}

// One Meta login gives us a Facebook Page (and the Instagram account linked to it).
// Page tokens minted from a long-lived user token don't expire, so no refresh().
export const meta: ProviderAdapter = {
  usesPkce: false,

  authorizeUrl({ state, redirectUri }) {
    const params = new URLSearchParams({
      client_id: requireEnv('META_APP_ID'),
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      scope: [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'business_management',
        'instagram_basic',
        'instagram_content_publish',
        // analytics
        'instagram_manage_insights',
        'read_insights',
      ].join(','),
    });
    return `https://www.facebook.com/${graphVersion()}/dialog/oauth?${params}`;
  },

  async connect({ code, redirectUri }) {
    const appId = requireEnv('META_APP_ID');
    const appSecret = requireEnv('META_APP_SECRET');

    const short = await fetchJson<{ access_token: string }>(
      graph('oauth/access_token', { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }),
      {},
      'Facebook'
    );
    const long = await fetchJson<{ access_token: string }>(
      graph('oauth/access_token', {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: short.access_token,
      }),
      {},
      'Facebook'
    );
    const pages = await fetchJson<{ data: Page[] }>(
      graph('me/accounts', {
        fields: 'id,name,access_token,instagram_business_account{id,username}',
        access_token: long.access_token,
      }),
      {},
      'Facebook'
    );

    // v1: use the first Page. Prefer one with Instagram linked, since that unlocks both targets.
    const page = pages.data.find((p) => p.instagram_business_account) ?? pages.data[0];
    if (!page) {
      throw new Error('No Facebook Page found. Publishing needs a Page you manage.');
    }

    const ig = page.instagram_business_account;
    return {
      accountId: page.id,
      accountName: page.name,
      metadata: { pageName: page.name, instagramUsername: ig?.username ?? null, hasInstagram: Boolean(ig) },
      tokens: {
        accessToken: page.access_token,
        extra: { pageId: page.id, igUserId: ig?.id ?? null },
      },
    };
  },
};
