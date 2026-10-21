/**
 * The app's clients against a local production build (`next start`) with
 * the proxy limiter on (ENABLE_RATE_LIMITING=true, Upstash credentials,
 * TRUSTED_PROXY=false; the default 50 requests a second is fine):
 *   MOBILE_E2E_API_URL=http://localhost:3000 MOBILE_E2E_PRODUCTION=1 bun run test:e2e
 * Run it on a fresh server: it spends the sign-in and request budgets (the
 * other suites skip themselves in this mode).
 */
import { describe, expect, setDefaultTimeout, test } from "bun:test";

import { E2E_API_URL as BASE, installNativeStubs } from "./native-stubs";

installNativeStubs();
setDefaultTimeout(60_000);

const { authClient } = await import("../src/lib/auth-client");
const { trpcClient } = await import("../src/lib/trpc");
const { authFailure } = await import("../src/lib/auth-failure");
const { getErrorCode } = await import("@infinitunes/core/error-code");
const { RATE_LIMITED_MESSAGE, userMessage } =
  await import("@infinitunes/core/user-message");
const { NATIVE_APP_ORIGIN, NATIVE_ORIGIN_HEADER } =
  await import("@infinitunes/auth/native-app");

const email = `e2e-prod-${Date.now().toString(36)}@example.test`;
const password = "E2e-Passw0rd!";

/** Outside the limiter's one-second window. */
const nextWindow = () => Bun.sleep(1100);

/** 120 native POSTs at once: well past the default 50 a second. */
async function burst() {
  const cookie = await authClient.getCookie();
  return Promise.all(
    Array.from({ length: 120 }, () =>
      fetch(`${BASE}/api/trpc/history.record`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
          [NATIVE_ORIGIN_HEADER]: NATIVE_APP_ORIGIN,
        },
        body: JSON.stringify({ json: { id: "e2eLimit", type: "song" } }),
      }).then((response) => response.status),
    ),
  );
}

describe.skipIf(
  !process.env.MOBILE_E2E_API_URL || !process.env.MOBILE_E2E_PRODUCTION,
)("mobile clients on a production build", () => {
  test("the production session cookie is stored and accepted by tRPC", async () => {
    expect(
      await authFailure(() =>
        authClient.signUp.email({ email, password, name: "prod" }),
      ),
    ).toBeUndefined();
    // Production keeps Better Auth's default prefix.
    expect(await authClient.getCookie()).toMatch(
      /^(__Secure-)?better-auth\.session_token=/,
    );
    expect(await trpcClient.user.getUserPlaylists.query()).toEqual([]);
    expect((await authClient.getSession()).data?.user.email).toBe(email);
  });

  test("native requests are charged to the limiter", async () => {
    await nextWindow();
    const statuses = await burst();
    expect(statuses).toContain(200);
    expect(statuses).toContain(429);
    expect(statuses.every((s) => s === 200 || s === 429)).toBe(true);
  });

  test("a limited call reaches the app as TOO_MANY_REQUESTS with its own copy", async () => {
    let error: unknown;
    // The app's call races a burst; a few tries make it one of the limited.
    for (let i = 0; i < 5 && !error; i++) {
      const [, failure] = await Promise.all([
        burst(),
        trpcClient.search.top.query().then(
          () => undefined,
          (reason: unknown) => reason,
        ),
      ]);
      error = failure;
    }
    expect(getErrorCode(error)).toBe("TOO_MANY_REQUESTS");
    expect(userMessage(error)).toBe(RATE_LIMITED_MESSAGE);
  });

  test("rapid sign-ins are limited and the form shows its rate-limit copy", async () => {
    await nextWindow();
    const failures = [];
    for (let i = 0; i < 6; i++) {
      failures.push(
        await authFailure(() =>
          authClient.signIn.email({ email, password: "Wrong-Passw0rd!" }),
        ),
      );
    }
    expect(failures[0]?.code).toBe("INVALID_EMAIL_OR_PASSWORD");
    expect(failures.at(-1)?.message).toBe(
      "Too many attempts. Please wait a minute and try again.",
    );
  });
});
