/**
 * One value of a route or query param. Expo Router hands a repeated key
 * (`?q=a&q=b`) over as an array: the first value counts, so a screen never
 * calls a string method on an array.
 */
export function single(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
