export const RECENT_SEARCHES_KEY = "recent_searches";
export const MAX_RECENT_SEARCHES = 6;

/** Puts `query` first, drops any earlier copy (case-insensitive) and caps the list. */
export function addRecentSearch(list: readonly string[], query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [...list];

  const rest = list.filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );
  return [trimmed, ...rest].slice(0, MAX_RECENT_SEARCHES);
}

/** Reads the stored JSON, ignoring anything that is not a list of strings. */
export function parseRecentSearches(raw: string | null) {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is string => typeof item === "string" && !!item.trim(),
      )
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}
