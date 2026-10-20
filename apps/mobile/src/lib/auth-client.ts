import { expoClient } from "@better-auth/expo/client";
import { SESSION_COOKIE_PREFIXES } from "@infinitunes/auth/session-cookie";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { env } from "./env";

/**
 * Better Auth against the web app's `/api/auth`. The session cookie is kept
 * in the keychain/keystore (`expo-secure-store`); `authClient.getCookie()`
 * returns it for requests that are not made through this client (tRPC).
 * The URL scheme comes from the app config.
 */
export const authClient = createAuthClient({
  baseURL: env.apiUrl,
  plugins: [
    expoClient({
      storage: SecureStore,
      storagePrefix: "infinitunes",
      cookiePrefix: [...SESSION_COOKIE_PREFIXES],
    }),
  ],
});
