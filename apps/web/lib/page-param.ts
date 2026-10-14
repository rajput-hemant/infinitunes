/**
 * Reads a `?page=` search param as a 1-based page number. Anything that is not
 * a positive whole number (missing, repeated, text, zero, negative, fractional)
 * falls back to the first page instead of reaching the catalog as NaN.
 */
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}
