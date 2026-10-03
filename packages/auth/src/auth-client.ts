"use client";

import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";

export function createAuthClient(options: { baseURL?: string } = {}) {
  return createBetterAuthClient({
    ...(options.baseURL ? { baseURL: options.baseURL } : {}),
    plugins: [passkeyClient()],
  });
}

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
