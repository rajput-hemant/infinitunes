import { describe, expect, test } from "bun:test";

import { FILTER_CACHE_LIMIT, FilterCache } from "~/lib/glass/filter-cache";

function makeCache(live: Set<string>) {
  const evicted: string[] = [];
  const cache = new FilterCache<string>(
    FILTER_CACHE_LIMIT,
    (id) => live.has(id),
    (id) => evicted.push(id),
  );
  return { cache, evicted };
}

describe("FilterCache", () => {
  test("returns the same entry for the same key and builds it once", () => {
    const { cache } = makeCache(new Set());
    let built = 0;
    const make = (id: string) => {
      built++;
      return id;
    };
    const first = cache.getOrCreate("a", make);
    const second = cache.getOrCreate("a", make);
    expect(second).toBe(first);
    expect(built).toBe(1);
  });

  test("ids come from a monotonic counter", () => {
    const { cache } = makeCache(new Set());
    expect(cache.getOrCreate("a", (id) => id)?.id).toBe("lg-0");
    expect(cache.getOrCreate("b", (id) => id)?.id).toBe("lg-1");
  });

  test("does not cache a failed build", () => {
    const { cache } = makeCache(new Set());
    expect(cache.getOrCreate("a", () => null)).toBeNull();
    expect(cache.size).toBe(0);
    expect(cache.getOrCreate("a", (id) => id)?.value).toBeString();
  });

  test("at the limit, a miss evicts unreferenced entries and keeps live ones", () => {
    const live = new Set<string>();
    const { cache, evicted } = makeCache(live);
    for (let i = 0; i < FILTER_CACHE_LIMIT; i++) {
      const entry = cache.getOrCreate(`k${i}`, (id) => id);
      if (i < 3 && entry) live.add(entry.id);
    }
    expect(cache.size).toBe(FILTER_CACHE_LIMIT);
    cache.getOrCreate("fresh", (id) => id);
    expect(evicted).toHaveLength(FILTER_CACHE_LIMIT - 3);
    expect(cache.size).toBe(4);
    expect(cache.get("k0")).toBeDefined();
    expect(cache.get("k10")).toBeUndefined();
  });

  test("below the limit nothing is evicted", () => {
    const { cache, evicted } = makeCache(new Set());
    for (let i = 0; i < 5; i++) cache.getOrCreate(`k${i}`, (id) => id);
    expect(evicted).toEqual([]);
  });
});
