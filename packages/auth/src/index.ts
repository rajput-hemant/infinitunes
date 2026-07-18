export { createAuth } from "./auth";
export type { Auth } from "./auth";

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
}
