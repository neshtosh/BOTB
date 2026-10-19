export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Server is missing the ${name} environment variable.`);
  return value;
}

// Public origin of the deployed site, e.g. https://botb.vercel.app (no trailing slash).
export const appUrl = () => requireEnv('APP_URL').replace(/\/$/, '');

export const graphVersion = () => process.env.META_GRAPH_VERSION ?? 'v23.0';
