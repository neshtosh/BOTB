// Demo-mode file storage: uploaded files live in this browser's IndexedDB.

const DB_NAME = 'unsigned-demo-files';
const STORE = 'files';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export const putFile = (path: string, blob: Blob) => run('readwrite', (s) => s.put(blob, path)).then(() => undefined);
export const getFile = (path: string) => run<Blob | undefined>('readonly', (s) => s.get(path));
export const deleteFile = (path: string) => run('readwrite', (s) => s.delete(path)).then(() => undefined);
export const clearFiles = () => run('readwrite', (s) => s.clear()).then(() => undefined);

// Object URLs for playback, cached so repeated lookups don't leak.
const urlCache = new Map<string, string>();
export async function fileUrl(path: string): Promise<string | null> {
  const cached = urlCache.get(path);
  if (cached) return cached;
  const blob = await getFile(path);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(path, url);
  return url;
}
export function forgetUrl(path: string) {
  const url = urlCache.get(path);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(path);
}
