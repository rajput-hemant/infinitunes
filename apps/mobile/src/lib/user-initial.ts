/** What an avatar needs of an account. */
export type InitialUser = { name?: string | null; email: string };

/** The avatar's letter: the name's first, else the email's (the web's `userInitial`). */
export function userInitial({ name, email }: InitialUser): string {
  return (name?.trim() || email.trim()).charAt(0).toUpperCase();
}
