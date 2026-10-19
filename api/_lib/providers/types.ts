export type Provider = 'youtube' | 'tiktok' | 'meta' | 'soundcloud';

export interface TokenSet {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  extra?: Record<string, unknown>;
}

export interface ConnectedAccount {
  accountId: string;
  accountName: string;
  metadata?: Record<string, unknown>;
  tokens: TokenSet;
}

export interface ProviderAdapter {
  usesPkce: boolean;
  authorizeUrl(p: { state: string; redirectUri: string; codeChallenge?: string }): string;
  connect(p: { code: string; redirectUri: string; codeVerifier?: string }): Promise<ConnectedAccount>;
  // Omitted for providers whose stored token doesn't expire (Meta page tokens).
  refresh?(tokens: TokenSet): Promise<TokenSet>;
}

export const expiresIn = (seconds?: number) =>
  seconds ? new Date(Date.now() + seconds * 1000) : null;
