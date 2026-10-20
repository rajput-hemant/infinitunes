/** Joins NativeWind class lists, skipping empty ones. */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
