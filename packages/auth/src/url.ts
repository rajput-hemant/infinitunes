export function parseUrl(url: string | null | undefined): URL | undefined {
  try {
    return url ? new URL(url) : undefined;
  } catch {
    return undefined;
  }
}

/** The origin of `value`, or `null` when it is empty or not a valid URL. */
export function originOf(value: string | null | undefined): string | null {
  return parseUrl(value)?.origin ?? null;
}
