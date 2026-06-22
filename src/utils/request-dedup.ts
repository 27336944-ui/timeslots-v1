/**
 * Request deduplication utility.
 *
 * Ensures concurrent requests with identical URL+body are coalesced into
 * a single in-flight promise. 30s timeout prevents Map leaks.
 */

interface DedupEntry {
  promise: Promise<unknown>;
  timer: ReturnType<typeof setTimeout>;
}

const inflight = new Map<string, DedupEntry>();

function stableKey(url: string, body?: unknown): string {
  return url + '::' + (body ? JSON.stringify(body) : '');
}

/**
 * Execute a request with deduplication.
 *
 * If an identical request is already in-flight, returns its Promise.
 * Otherwise, executes the factory and caches the result.
 */
export async function deduped<T>(
  url: string,
  factory: () => Promise<T>,
  body?: unknown,
): Promise<T> {
  const key = stableKey(url, body);
  const existing = inflight.get(key);
  if (existing) return existing.promise as Promise<T>;

  let resolveOutside!: (v: T | PromiseLike<T>) => void;
  let rejectOutside!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveOutside = resolve;
    rejectOutside = reject;
  });

  const timer = setTimeout(() => {
    inflight.delete(key);
  }, 30000);

  inflight.set(key, { promise, timer });

  try {
    const result = await factory();
    resolveOutside(result);
    return result;
  } catch (e) {
    rejectOutside(e);
    throw e;
  } finally {
    clearTimeout(timer);
    inflight.delete(key);
  }
}
