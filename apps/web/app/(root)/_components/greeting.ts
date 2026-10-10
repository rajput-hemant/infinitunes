/** Shown on the server and during hydration, before the visitor's clock is known. */
export const FALLBACK_GREETING = "Welcome";

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** "Good evening, Ada", or just the salutation while signed out or loading. */
export function formatGreeting(salutation: string, name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? `${salutation}, ${trimmed}` : salutation;
}
