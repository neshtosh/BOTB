import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { demoClient } from './demo/client';
import { demoApi } from './demo/api';
import { seedIfEmpty } from './demo/seed';
import { clearFiles } from './demo/blobStore';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Demo mode: no Supabase project configured (or VITE_DEMO_MODE=true). The app
// then runs against an in-browser mock backend with a seeded demo account,
// so the whole UI can be built and tried without any services.
export const isDemoMode = !(url && anonKey) || import.meta.env.VITE_DEMO_MODE === 'true';

if (isDemoMode) seedIfEmpty();

export const supabase: SupabaseClient = isDemoMode
  ? (demoClient as unknown as SupabaseClient)
  : createClient(url!, anonKey!);

export const MEDIA_BUCKET = 'media';

// Calls one of our Vercel API functions with the signed-in user's token.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (isDemoMode) return demoApi<T>(path, init);
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

// Wipes the demo database and stored files, then reloads with fresh seed data.
export async function resetDemo() {
  localStorage.removeItem('unsigned-demo-db');
  await clearFiles().catch(() => undefined);
  window.location.assign('/');
}
