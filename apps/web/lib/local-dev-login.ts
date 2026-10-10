import { getLocalDevFixture } from "@infinitunes/db/fixtures";
import { isLocalDatabase } from "@infinitunes/db/local-guard";

type LoginUser = { email: string; password: string };

/**
 * The sign-in hint for the shared local user, or null unless DATABASE_URL is
 * loopback and NODE_ENV is not production. `getUser` is only called once the
 * guard passes.
 */
export function localDevLoginMessage(
  env: { DATABASE_URL?: string; NODE_ENV?: string },
  getUser: () => LoginUser,
): string | null {
  if (!env.DATABASE_URL || !isLocalDatabase(env.DATABASE_URL, env.NODE_ENV)) {
    return null;
  }
  const { email, password } = getUser();
  return `[local-dev] Sign in with ${email} / ${password} (run \`bun run db:seed\` first if the account does not exist)`;
}

export function logLocalDevLogin() {
  try {
    const message = localDevLoginMessage(
      process.env,
      () => getLocalDevFixture().user,
    );
    if (message) console.log(message);
  } catch (error) {
    console.warn("[local-dev] Could not read the local user fixture:", error);
  }
}
