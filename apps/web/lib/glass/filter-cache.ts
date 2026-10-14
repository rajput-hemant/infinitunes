/** Filters are cached by key; at this size, unreferenced ones are evicted. */
export const FILTER_CACHE_LIMIT = 24;

type Entry<T> = { id: string; value: T };

/**
 * Cache of lens filters keyed by size. Maps do not resize with their element,
 * so each distinct size needs its own filter. When the cache is full, a miss
 * first evicts every entry no connected surface still references.
 */
export class FilterCache<T> {
  private entries = new Map<string, Entry<T>>();
  private seq = 0;

  constructor(
    private readonly limit: number = FILTER_CACHE_LIMIT,
    private readonly isLive: (id: string) => boolean,
    private readonly onEvict: (id: string, value: T) => void,
  ) {}

  get size(): number {
    return this.entries.size;
  }

  get(key: string): { id: string; value: T } | undefined {
    return this.entries.get(key);
  }

  /**
   * Returns the cached entry, or builds one under a fresh monotonic id
   * (`lg-0`, `lg-1`, ...). A `create` that returns `null` (no SVG host yet, no
   * canvas) is not cached, so the next call retries.
   */
  getOrCreate(
    key: string,
    create: (id: string) => T | null,
  ): { id: string; value: T } | null {
    const hit = this.entries.get(key);
    if (hit) return hit;
    if (this.entries.size >= this.limit) this.collect();
    const id = `lg-${this.seq++}`;
    const value = create(id);
    if (value === null) return null;
    const entry = { id, value };
    this.entries.set(key, entry);
    return entry;
  }

  forEach(visit: (entry: Entry<T>) => void) {
    this.entries.forEach(visit);
  }

  /** Evicts every entry nothing references. */
  collect() {
    for (const [key, entry] of this.entries) {
      if (!this.isLive(entry.id)) {
        this.entries.delete(key);
        this.onEvict(entry.id, entry.value);
      }
    }
  }
}
