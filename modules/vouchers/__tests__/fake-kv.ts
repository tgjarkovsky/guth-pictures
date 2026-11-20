/** Minimal in-memory stand-in for the @vercel/kv calls the voucher store uses. */
export function createFakeKv() {
  const data = new Map<string, unknown>();
  const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
  return {
    data,
    async get<T>(k: string): Promise<T | null> { return data.has(k) ? clone(data.get(k) as T) : null; },
    async set(k: string, v: unknown, opts?: { nx?: boolean; ex?: number }) {
      if (opts?.nx && data.has(k)) return null;
      data.set(k, clone(v));
      return "OK";
    },
    async del(k: string) { return data.delete(k) ? 1 : 0; },
    async incr(k: string) { const n = Number(data.get(k) ?? 0) + 1; data.set(k, n); return n; },
    async lpush(k: string, ...v: unknown[]) { const l = (data.get(k) as unknown[]) ?? []; l.unshift(...v.reverse()); data.set(k, l); return l.length; },
    async lrange<T>(k: string, a: number, b: number): Promise<T[]> { const l = (data.get(k) as T[]) ?? []; return l.slice(a, b === -1 ? undefined : b + 1); },
    async mget<T>(...keys: string[]): Promise<T> { return keys.map((k) => (data.has(k) ? clone(data.get(k)) : null)) as T; },
  };
}
