export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** The salutation for the listener's local time now. */
export function currentSalutation(): string {
  return greetingForHour(new Date().getHours());
}

/** "Good evening, Ada", or just the salutation while signed out or loading. */
export function formatGreeting(salutation: string, name?: string | null) {
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${salutation}, ${first}` : salutation;
}
