/**
 * The app's own auth and tRPC clients (`src/lib/auth-client.ts`,
 * `src/lib/trpc.ts`) against a running web app and its database: sign-up to
 * sign-out, every library write, the proxy's origin guard and the redirect
 * rules. Only native modules are stubbed (`native-stubs.ts`).
 *
 * Opt-in, and only against a local scratch stack (it creates accounts) on
 * `next dev`:
 *   MOBILE_E2E_API_URL=http://localhost:3000 bun run test:e2e
 * MOBILE_E2E_SERVER_LOG=<file the dev server logs to> also follows the
 * password-reset email (logged, not sent, without RESEND_API_KEY).
 */
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from "bun:test";
import { readFileSync } from "node:fs";

import {
  E2E_API_URL as BASE,
  constants,
  createSecureStore,
  installNativeStubs,
  secureStore,
} from "./native-stubs";

installNativeStubs();
setDefaultTimeout(60_000);

const { authClient } = await import("../src/lib/auth-client");
const { trpcClient } = await import("../src/lib/trpc");
const { authFailure } = await import("../src/lib/auth-failure");
const { getErrorCode } = await import("@infinitunes/core/error-code");
const { NATIVE_APP_ORIGIN, NATIVE_ORIGIN_HEADER } =
  await import("@infinitunes/auth/native-app");
const { SESSION_COOKIE_PREFIXES } =
  await import("@infinitunes/auth/session-cookie");
const { createAuthClient } = await import("better-auth/react");
const { expoClient } = await import("@better-auth/expo/client");
const { createTRPCClient, httpBatchLink } = await import("@trpc/client");
const { default: superjson } = await import("superjson");
type AppRouter = import("@infinitunes/trpc/types").AppRouter;

const SERVER_LOG = process.env.MOBILE_E2E_SERVER_LOG;
const run = Date.now().toString(36);
const email = `e2e-${run}@example.test`;
const otherEmail = `e2e-other-${run}@example.test`;
const password = "E2e-Passw0rd!";
const newPassword = "E2e-Newer-Passw0rd!";
const SONGS = ["e2eSongA", "e2eSongB", "e2eSongC", "e2eSongD", "e2eSongE"];

/** "OK", or the tRPC error code the call failed with. */
async function codeOf(promise: Promise<unknown>) {
  try {
    await promise;
    return "OK";
  } catch (error) {
    return getErrorCode(error) ?? String(error);
  }
}

/** A second phone: the app's expo client config with its own keychain. */
function secondDevice() {
  const storage = createSecureStore();
  const client = createAuthClient({
    baseURL: BASE,
    plugins: [
      expoClient({
        storage,
        storagePrefix: "infinitunes",
        cookiePrefix: [...SESSION_COOKIE_PREFIXES],
      }),
    ],
  });
  const trpc = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${BASE}/api/trpc`,
        transformer: superjson,
        headers: async () => {
          const cookie = await client.getCookie();
          return {
            [NATIVE_ORIGIN_HEADER]: NATIVE_APP_ORIGIN,
            ...(cookie ? { cookie } : {}),
          };
        },
        fetch: (url, options) =>
          fetch(url, { ...options, credentials: "omit" }),
      }),
    ],
  });
  return { client, trpc, storage };
}

/** A browser tab on the web app: same-origin `Origin`, a cookie jar. */
function browserTab() {
  const jar = new Map<string, string>();
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const sameOrigin = { origin: BASE, "sec-fetch-site": "same-origin" };
  async function request(path: string, body: unknown) {
    const response = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        ...sameOrigin,
        "content-type": "application/json",
        cookie: cookie(),
      },
      body: JSON.stringify(body),
    });
    for (const line of response.headers.getSetCookie()) {
      const [pair = ""] = line.split(";");
      const at = pair.indexOf("=");
      const value = pair.slice(at + 1);
      if (/max-age=0/i.test(line) || value === "")
        jar.delete(pair.slice(0, at));
      else jar.set(pair.slice(0, at), value);
    }
    return response;
  }
  const trpc = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${BASE}/api/trpc`,
        transformer: superjson,
        headers: () => ({ ...sameOrigin, cookie: cookie() }),
      }),
    ],
  });
  return { request, trpc };
}

/** One unbatched tRPC request with exactly these headers. */
async function rawTrpc(
  path: string,
  method: "GET" | "POST",
  headers: Record<string, string>,
  input?: unknown,
) {
  const body = JSON.stringify(superjson.serialize(input ?? null));
  const all = { "content-type": "application/json", ...headers };
  const response =
    method === "GET"
      ? await fetch(
          `${BASE}/api/trpc/${path}?input=${encodeURIComponent(body)}`,
          { headers: all },
        )
      : await fetch(`${BASE}/api/trpc/${path}`, {
          method: "POST",
          headers: all,
          body,
        });
  return { status: response.status, body: await response.text() };
}

/** The last reset link logged for `address` (the dev mailer logs it). */
function resetLinkFromLog(address: string): string | undefined {
  if (!SERVER_LOG) return undefined;
  const log = readFileSync(SERVER_LOG, "utf8");
  const at = log.lastIndexOf(`To: ${address}`);
  if (at < 0) return undefined;
  return /https?:\/\/\S+\/api\/auth\/reset-password\/\S+/.exec(
    log.slice(at),
  )?.[0];
}

// A production run spends the sign-in and request budgets these need.
describe.skipIf(
  !process.env.MOBILE_E2E_API_URL || Boolean(process.env.MOBILE_E2E_PRODUCTION),
)("mobile clients on the real stack", () => {
  describe("auth", () => {
    test("signed out: no session, no cookie, protected calls UNAUTHORIZED", async () => {
      expect((await authClient.getSession()).data).toBeNull();
      expect(await authClient.getCookie()).toBe("");
      expect(await codeOf(trpcClient.user.getUserPlaylists.query())).toBe(
        "UNAUTHORIZED",
      );
      expect(await codeOf(trpcClient.history.list.query())).toBe(
        "UNAUTHORIZED",
      );
    });

    test("sign-up (as the form sends it) keeps the session cookie in secure storage", async () => {
      expect(
        await authFailure(() =>
          authClient.signUp.email({
            email,
            password,
            name: email.split("@")[0] ?? "",
          }),
        ),
      ).toBeUndefined();
      expect(await authClient.getCookie()).toMatch(
        /(^|; )(__Secure-)?(infinitunes|better-auth)\.session_token=/,
      );
      expect([...secureStore.items.keys()]).toContain("infinitunes_cookie");
      const { data } = await authClient.getSession();
      expect(data?.user).toMatchObject({ email, name: email.split("@")[0] });
    });

    test("an existing email cannot sign up again", async () => {
      const device = secondDevice();
      const { error } = await device.client.signUp.email({
        email,
        password,
        name: "again",
      });
      expect(error?.status).toBe(422);
      expect(await device.client.getCookie()).toBe("");
    });

    test("sign-out revokes the session on the server; sign-in stores a new one", async () => {
      const before = await authClient.getCookie();
      expect(await authFailure(() => authClient.signOut())).toBeUndefined();
      expect(await authClient.getCookie()).toBe("");
      // Revoked, not just forgotten by the client.
      const replay = await rawTrpc("user.getUserPlaylists", "GET", {
        cookie: before,
      });
      expect(replay.status).toBe(401);

      const wrong = await authFailure(() =>
        authClient.signIn.email({ email, password: "Wrong-Passw0rd!" }),
      );
      expect(wrong?.code).toBe("INVALID_EMAIL_OR_PASSWORD");
      expect(
        await authFailure(() => authClient.signIn.email({ email, password })),
      ).toBeUndefined();
      const after = await authClient.getCookie();
      expect(after).toMatch(/session_token=/);
      expect(after).not.toBe(before);
    });

    test("a dev-client build's expo-origin (scheme://host:port) is trusted too", async () => {
      constants.expoConfig.hostUri = "192.168.1.5:8081";
      try {
        const device = secondDevice();
        expect(
          await authFailure(() =>
            device.client.signIn.email({ email, password }),
          ),
        ).toBeUndefined();
        await device.client.signOut();
      } finally {
        delete constants.expoConfig.hostUri;
      }
    });

    test("an unknown expo-origin is refused by Better Auth", async () => {
      const response = await fetch(`${BASE}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [NATIVE_ORIGIN_HEADER]: "evilapp://",
        },
        body: JSON.stringify({ email, password }),
      });
      expect(response.status).toBe(403);
    });
  });

  describe("library writes with the stored cookie", () => {
    let playlistId = "";

    test("a new account has no favorites row, playlists or history", async () => {
      expect(await trpcClient.user.getUserFavorites.query()).toBeNull();
      expect(await trpcClient.user.getUserPlaylists.query()).toEqual([]);
      expect(await trpcClient.history.list.query()).toEqual([]);
    });

    test("like and unlike a song, an album and an artist", async () => {
      for (const [type, token] of [
        ["song", "e2eSong1"],
        ["album", "e2eAlbum1"],
        ["artist", "e2eArtist1"],
        ["song", "e2eSong1"],
      ] as const) {
        await trpcClient.user.addToFavorites.mutate({ type, token });
      }
      expect(await trpcClient.user.getUserFavorites.query()).toMatchObject({
        songs: ["e2eSong1"],
        albums: ["e2eAlbum1"],
        artists: ["e2eArtist1"],
      });
      for (const [type, token] of [
        ["song", "e2eSong1"],
        ["album", "e2eAlbum1"],
        ["artist", "e2eArtist1"],
      ] as const) {
        await trpcClient.user.removeFromFavorites.mutate({ type, token });
      }
      expect(await trpcClient.user.getUserFavorites.query()).toMatchObject({
        songs: [],
        albums: [],
        artists: [],
      });
    });

    test("20 parallel likes all land", async () => {
      const tokens = Array.from({ length: 20 }, (_, i) => `e2eParallel${i}`);
      await Promise.all(
        tokens.map((token) =>
          trpcClient.user.addToFavorites.mutate({ type: "song", token }),
        ),
      );
      const lists = await trpcClient.user.getUserFavorites.query();
      expect(lists?.songs.toSorted()).toEqual(tokens.toSorted());
      await Promise.all(
        tokens.map((token) =>
          trpcClient.user.removeFromFavorites.mutate({ type: "song", token }),
        ),
      );
    });

    test("create, rename, add, remove and move songs; stale positions are refused", async () => {
      ({ id: playlistId } = await trpcClient.user.createNewPlaylist.mutate({
        name: "E2E mix",
      }));
      const renamed = await trpcClient.user.renamePlaylist.mutate({
        playlistId,
        name: "E2E renamed",
        description: "from the phone",
      });
      expect(renamed).toMatchObject({
        name: "E2E renamed",
        description: "from the phone",
      });
      const add = (songs: string[]) =>
        trpcClient.user.addSongsToPlaylist.mutate({ playlistId, songs });
      expect((await add(SONGS)).songs).toEqual(SONGS);
      expect((await add([SONGS[0] ?? ""])).songs).toEqual(SONGS);
      const [a, b, c, d, e] = SONGS as [string, string, string, string, string];
      const removed = await trpcClient.user.removeSongsFromPlaylist.mutate({
        playlistId,
        index: 1,
        songId: b,
      });
      expect(removed.songs).toEqual([a, c, d, e]);
      const moved = await trpcClient.user.movePlaylistSong.mutate({
        playlistId,
        from: 3,
        to: 0,
        songId: e,
      });
      expect(moved.songs).toEqual([e, a, c, d]);
      for (const stale of [
        trpcClient.user.movePlaylistSong.mutate({
          playlistId,
          from: 0,
          to: 2,
          songId: a,
        }),
        trpcClient.user.movePlaylistSong.mutate({
          playlistId,
          from: 0,
          to: 9,
          songId: e,
        }),
        trpcClient.user.removeSongsFromPlaylist.mutate({
          playlistId,
          index: 0,
          songId: a,
        }),
      ]) {
        expect(await codeOf(stale)).toBe("BAD_REQUEST");
      }
      const stored = await trpcClient.user.getPlaylistDetails.query({
        playlistId,
      });
      expect(stored?.songs).toEqual([e, a, c, d]);
    });

    test("concurrent writes from the phone and a browser tab lose nothing", async () => {
      const tab = browserTab();
      expect(
        (await tab.request("/api/auth/sign-in/email", { email, password }))
          .status,
      ).toBe(200);
      const extra = Array.from({ length: 12 }, (_, i) => `e2eConc${i}`);
      await Promise.all(
        extra.map((song, i) =>
          (i % 2 ? trpcClient : tab.trpc).user.addSongsToPlaylist.mutate({
            playlistId,
            songs: [song],
          }),
        ),
      );
      const songs =
        (await trpcClient.user.getPlaylistDetails.query({ playlistId }))
          ?.songs ?? [];
      expect(songs.toSorted()).toEqual(
        [...SONGS.filter((s) => s !== SONGS[1]), ...extra].toSorted(),
      );

      // Two moves of one song from the same view: one applies, one is stale.
      const first = songs[0] ?? "";
      const results = await Promise.all([
        codeOf(
          trpcClient.user.movePlaylistSong.mutate({
            playlistId,
            from: 0,
            to: songs.length - 1,
            songId: first,
          }),
        ),
        codeOf(
          tab.trpc.user.movePlaylistSong.mutate({
            playlistId,
            from: 0,
            to: 1,
            songId: first,
          }),
        ),
      ]);
      expect(results.toSorted()).toEqual(["BAD_REQUEST", "OK"]);
      const after = await trpcClient.user.getPlaylistDetails.query({
        playlistId,
      });
      expect(after?.songs.toSorted()).toEqual(songs.toSorted());
      await tab.request("/api/auth/sign-out", {});
    });

    test("another account's playlist is FORBIDDEN, a missing one NOT_FOUND", async () => {
      const other = secondDevice();
      expect(
        (
          await other.client.signUp.email({
            email: otherEmail,
            password,
            name: "other",
          })
        ).error,
      ).toBeNull();
      expect(
        await codeOf(
          other.trpc.user.addSongsToPlaylist.mutate({
            playlistId,
            songs: ["x"],
          }),
        ),
      ).toBe("FORBIDDEN");
      expect(
        await codeOf(other.trpc.user.deletePlaylist.mutate({ playlistId })),
      ).toBe("FORBIDDEN");
      expect(
        await other.trpc.user.getPlaylistDetails.query({ playlistId }),
      ).toBeNull();
      expect(
        await codeOf(
          other.trpc.user.renamePlaylist.mutate({
            playlistId: "00000000-0000-4000-8000-000000000000",
            name: "nope",
          }),
        ),
      ).toBe("NOT_FOUND");
      await other.client.signOut();
    });

    test("delete the playlist", async () => {
      const deleted = await trpcClient.user.deletePlaylist.mutate({
        playlistId,
      });
      expect(deleted?.id).toBe(playlistId);
      expect(await trpcClient.user.getUserPlaylists.query()).toEqual([]);
    });

    test("12 parallel creates stop at the 10-playlist cap", async () => {
      const results = await Promise.all(
        Array.from({ length: 12 }, (_, i) =>
          codeOf(
            trpcClient.user.createNewPlaylist.mutate({ name: `Cap ${i}` }),
          ),
        ),
      );
      const owned = await trpcClient.user.getUserPlaylists.query();
      await Promise.all(
        owned.map((p) =>
          trpcClient.user.deletePlaylist.mutate({ playlistId: p.id }),
        ),
      );
      expect(owned).toHaveLength(10);
      expect(results.filter((r) => r === "BAD_REQUEST")).toHaveLength(2);
    });

    test("history: newest first, one entry per item; recordPlay records", async () => {
      await trpcClient.history.record.mutate({
        id: "e2eSongH1",
        type: "song",
      });
      await trpcClient.history.record.mutate({
        id: "e2eEpH1",
        type: "episode",
      });
      await trpcClient.history.record.mutate({
        id: "e2eSongH1",
        type: "song",
      });
      expect(await trpcClient.history.list.query()).toEqual([
        { id: "e2eSongH1", type: "song" },
        { id: "e2eEpH1", type: "episode" },
      ]);
      const { recordPlay } = await import("../src/playback/record-play");
      await recordPlay({ id: "e2eSongH2", type: "song" });
      expect((await trpcClient.history.list.query())[0]).toEqual({
        id: "e2eSongH2",
        type: "song",
      });
    });

    test("profile: rename; an email change needs the current password", async () => {
      const renamed = await trpcClient.user.updateUser.mutate({
        name: "E2E Listener",
      });
      expect(renamed?.betterAuthName).toBe("E2E Listener");
      const { data } = await authClient.getSession({
        query: { disableCookieCache: true },
      });
      expect(data?.user.name).toBe("E2E Listener");
      const moved = `moved-${email}`;
      expect(
        await codeOf(trpcClient.user.updateUser.mutate({ email: moved })),
      ).toBe("BAD_REQUEST");
      expect(
        await codeOf(
          trpcClient.user.updateUser.mutate({
            email: moved,
            currentPassword: "nope",
          }),
        ),
      ).toBe("BAD_REQUEST");
      expect(
        await codeOf(
          trpcClient.user.updateUser.mutate({
            email: otherEmail,
            currentPassword: password,
          }),
        ),
      ).toBe("CONFLICT");
      // The same address in another case is not a change.
      expect(
        await codeOf(
          trpcClient.user.updateUser.mutate({ email: email.toUpperCase() }),
        ),
      ).toBe("OK");
    });

    test("change password keeps this phone signed in and signs out the other device", async () => {
      const other = secondDevice();
      expect(
        await authFailure(() => other.client.signIn.email({ email, password })),
      ).toBeUndefined();
      expect(await other.trpc.user.getUserPlaylists.query()).toEqual([]);
      expect(
        await codeOf(
          trpcClient.user.changePassword.mutate({
            password: "Wrong-0ne!",
            newPassword,
          }),
        ),
      ).toBe("BAD_REQUEST");
      expect(
        await codeOf(
          trpcClient.user.changePassword.mutate({ password, newPassword }),
        ),
      ).toBe("OK");
      expect(await trpcClient.user.getUserPlaylists.query()).toEqual([]);
      expect(await codeOf(other.trpc.user.getUserPlaylists.query())).toBe(
        "UNAUTHORIZED",
      );
      // The revoked phone finds out on its next session check.
      expect((await other.client.getSession()).data).toBeNull();
      expect(await other.client.getCookie()).toBe("");
      const fresh = secondDevice();
      expect(
        (
          await authFailure(() =>
            fresh.client.signIn.email({ email, password }),
          )
        )?.code,
      ).toBe("INVALID_EMAIL_OR_PASSWORD");
      expect(
        await authFailure(() =>
          fresh.client.signIn.email({ email, password: newPassword }),
        ),
      ).toBeUndefined();
      await fresh.client.signOut();
    });
  });

  describe("redirects stay on the web", () => {
    test("forgot password answers the same for known and unknown emails", async () => {
      for (const address of [email, `nobody-${run}@example.test`]) {
        expect(
          await authFailure(() =>
            authClient.requestPasswordReset({
              email: address,
              redirectTo: `${BASE}/reset-password`,
            }),
          ),
        ).toBeUndefined();
      }
    });

    test("an app-scheme redirectTo or callbackURL is refused with 403", async () => {
      const reset = await authClient.requestPasswordReset({
        email,
        redirectTo: "infinitunes://reset-password",
      });
      expect(reset.error?.status).toBe(403);
      const device = secondDevice();
      // The expo client turns a relative callbackURL into the app's scheme.
      for (const callbackURL of ["/home", "infinitunes://home"]) {
        const signIn = await device.client.signIn.email({
          email,
          password: newPassword,
          callbackURL,
        });
        expect(signIn.error?.status).toBe(403);
      }
      expect(await device.client.getCookie()).toBe("");
    });

    test.skipIf(!SERVER_LOG)(
      "the emailed link opens the web reset page; resetting signs every device out",
      async () => {
        let link: string | undefined;
        for (let i = 0; i < 20 && !link; i++) {
          link = resetLinkFromLog(email);
          if (!link) await Bun.sleep(250);
        }
        expect(link).toBeDefined();
        const url = new URL(link ?? "");
        expect(url.origin).toBe(new URL(BASE).origin);
        expect(url.searchParams.get("callbackURL")).toBe(
          `${BASE}/reset-password`,
        );
        const token = url.pathname.split("/").pop() ?? "";
        const opened = await fetch(url, { redirect: "manual" });
        expect(opened.status).toBe(302);
        expect(opened.headers.get("location")).toBe(
          `${BASE}/reset-password?token=${token}`,
        );

        const other = secondDevice();
        expect(
          await authFailure(() =>
            other.client.signIn.email({ email, password: newPassword }),
          ),
        ).toBeUndefined();
        expect(
          await authFailure(() =>
            authClient.resetPassword({ newPassword: password, token }),
          ),
        ).toBeUndefined();
        expect(await codeOf(other.trpc.user.getUserPlaylists.query())).toBe(
          "UNAUTHORIZED",
        );
        expect(await codeOf(trpcClient.user.getUserPlaylists.query())).toBe(
          "UNAUTHORIZED",
        );
        expect((await authClient.getSession()).data).toBeNull();
        expect(await authClient.getCookie()).toBe("");
        expect(
          (
            await authFailure(() =>
              authClient.resetPassword({ newPassword, token }),
            )
          )?.code,
        ).toBe("INVALID_TOKEN");
      },
    );

    afterAll(async () => {
      // Signed in with whichever password the reset test left.
      if (!(await authClient.getCookie())) {
        await authClient.signIn.email({ email, password });
        if (!(await authClient.getCookie())) {
          await authClient.signIn.email({ email, password: newPassword });
        }
      }
    });
  });

  describe("proxy origin guard on /api/trpc", () => {
    let cookie = "";
    const input = { name: "Proxy check" };

    beforeAll(async () => {
      cookie = await authClient.getCookie();
      expect(cookie).not.toBe("");
    });

    test("a native POST with the exact header is accepted", async () => {
      const response = await rawTrpc(
        "user.createNewPlaylist",
        "POST",
        { cookie, [NATIVE_ORIGIN_HEADER]: NATIVE_APP_ORIGIN },
        input,
      );
      expect(response.status).toBe(200);
    });

    test.each([
      ["no header", {}],
      [
        "a wrong header value",
        { [NATIVE_ORIGIN_HEADER]: "infinitunes://evil" },
      ],
      ["another scheme", { [NATIVE_ORIGIN_HEADER]: "exp://" }],
      [
        "the header and a cross-site Origin",
        {
          [NATIVE_ORIGIN_HEADER]: NATIVE_APP_ORIGIN,
          origin: "https://evil.example",
        },
      ],
      [
        "the header and Sec-Fetch-Site",
        {
          [NATIVE_ORIGIN_HEADER]: NATIVE_APP_ORIGIN,
          "sec-fetch-site": "cross-site",
        },
      ],
      [
        "the header and Sec-Fetch-Site same-origin",
        {
          [NATIVE_ORIGIN_HEADER]: NATIVE_APP_ORIGIN,
          "sec-fetch-site": "same-origin",
        },
      ],
      ["Origin null", { origin: "null" }],
    ])("a POST with %s is 403", async (_label, headers) => {
      const response = await rawTrpc(
        "user.createNewPlaylist",
        "POST",
        { cookie, ...headers },
        input,
      );
      expect(response.status).toBe(403);
    });

    test("a same-origin browser POST is accepted", async () => {
      const response = await rawTrpc(
        "user.createNewPlaylist",
        "POST",
        { cookie, origin: BASE, "sec-fetch-site": "same-origin" },
        input,
      );
      expect(response.status).toBe(200);
    });

    test("GET queries need no headers; a cross-site Referer is refused", async () => {
      const own = await rawTrpc("user.getUserPlaylists", "GET", { cookie });
      expect(own.status).toBe(200);
      expect(JSON.parse(own.body).result.data.json).toHaveLength(2);
      expect((await rawTrpc("search.top", "GET", {})).status).toBe(200);
      const referred = await rawTrpc("user.getUserPlaylists", "GET", {
        cookie,
        referer: "https://evil.example/page",
      });
      expect(referred.status).toBe(403);
    });

    afterAll(async () => {
      const owned = await trpcClient.user.getUserPlaylists.query();
      await Promise.all(
        owned.map((p) =>
          trpcClient.user.deletePlaylist.mutate({ playlistId: p.id }),
        ),
      );
    });
  });

  describe("sign-out", () => {
    test("protected calls fail UNAUTHORIZED and recordPlay sends nothing", async () => {
      const before = await authClient.getCookie();
      expect(await authFailure(() => authClient.signOut())).toBeUndefined();
      expect(await authClient.getCookie()).toBe("");
      expect(await codeOf(trpcClient.user.getUserFavorites.query())).toBe(
        "UNAUTHORIZED",
      );
      expect(
        await codeOf(
          trpcClient.history.record.mutate({ id: "x", type: "song" }),
        ),
      ).toBe("UNAUTHORIZED");
      const replay = await rawTrpc("user.getUserFavorites", "GET", {
        cookie: before,
      });
      expect(replay.status).toBe(401);

      const sent: string[] = [];
      const realFetch = globalThis.fetch;
      globalThis.fetch = Object.assign(
        (url: string | URL | Request, init?: RequestInit) => {
          sent.push(String(url));
          return realFetch(url, init);
        },
        realFetch,
      );
      try {
        const { recordPlay } = await import("../src/playback/record-play");
        await recordPlay({ id: "e2eSongH3", type: "song" });
      } finally {
        globalThis.fetch = realFetch;
      }
      expect(sent).toEqual([]);
    });
  });
});
