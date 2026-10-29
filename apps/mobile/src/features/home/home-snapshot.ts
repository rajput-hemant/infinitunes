import type { Modules } from "@infinitunes/types";
import Storage from "expo-sqlite/kv-store";

/**
 * The last launch data the server sent, kept so a cold start shows Home at
 * once and refreshes it in the background (the 5-minute `staleTime` decides
 * when). Home is a public procedure: nothing in it belongs to the listener.
 * One entry for the current languages only, so storage holds one feed.
 */
type HomeSnapshot = { lang: string; savedAt: number; data: Modules };

// Bump when the stored shape changes; an old entry is then ignored.
const KEY = "home-snapshot:v1";

/** A key for "no languages chosen" that no language list can equal. */
const langKey = (lang: string | undefined) => lang ?? "";

// Read once per launch: `initialData` and `initialDataUpdatedAt` both ask.
let cached: HomeSnapshot | null | undefined;

function load(): HomeSnapshot | null {
  if (cached === undefined) {
    try {
      const raw = Storage.getItemSync(KEY);
      cached = raw ? (JSON.parse(raw) as HomeSnapshot) : null;
    } catch {
      // An unreadable entry is only a lost head start: Home loads as usual.
      cached = null;
    }
  }
  return cached;
}

/** The stored feed for these languages, or `undefined`. */
export function readHomeSnapshot(lang: string | undefined) {
  const snapshot = load();
  return snapshot?.lang === langKey(lang) ? snapshot : undefined;
}

/** Keeps `data` unless the stored copy for these languages is as new. */
export function saveHomeSnapshot(
  lang: string | undefined,
  data: Modules,
  savedAt: number,
) {
  const current = readHomeSnapshot(lang);
  if (current && current.savedAt >= savedAt) return;
  cached = { lang: langKey(lang), savedAt, data };
  // A failed write only costs the next launch its head start.
  Storage.setItemAsync(KEY, JSON.stringify(cached)).catch(() => {});
}

/** Drops the stored feed (tests; a schema change needs a new `KEY`). */
export function forgetHomeSnapshot() {
  cached = null;
  Storage.removeItemAsync(KEY).catch(() => {});
}
