export { createAuth } from "./auth";
export type { Auth } from "./auth";
export { createSendEmail, MailConfigError } from "./mail";
export type { Email, SendEmail } from "./mail";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
