import type { VercelResponse } from '@vercel/node';
import { HttpError } from './supabaseAdmin.js';

export function sendError(res: VercelResponse, err: unknown) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : 'Unexpected error.';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
}

// fetch wrapper that throws with the platform's own error text, which is what
// creators need to see when e.g. a video is rejected.
export async function fetchJson<T>(url: string, init: RequestInit = {}, platform = 'Platform'): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // keep raw text
  }
  if (!res.ok) {
    throw new Error(`${platform} error (${res.status}): ${describe(body)}`);
  }
  return body as T;
}

interface PlatformErrorBody {
  error?: string | { message?: string };
  error_description?: string;
  errors?: { error_message?: string }[];
}

function describe(body: unknown): string {
  if (typeof body === 'string') return body.slice(0, 300);
  const b = body as PlatformErrorBody;
  return (
    (typeof b?.error === 'object' ? b.error.message : undefined) ??
    b?.error_description ??
    (typeof b?.error === 'string' ? b.error : undefined) ??
    b?.errors?.[0]?.error_message ??
    JSON.stringify(body).slice(0, 300)
  );
}

export const form = (data: Record<string, string>) => new URLSearchParams(data);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
