// Runs `callback` when the browser has a quiet moment (or after `timeout` ms at
// the latest). Safari has no requestIdleCallback, so it falls back to a timer.
// Returns a function that cancels the call.
export function whenIdle(callback: () => void, timeout = 1000): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 50);
  return () => window.clearTimeout(id);
}

export const nextIdle = (timeout?: number) => new Promise<void>((resolve) => whenIdle(resolve, timeout));
