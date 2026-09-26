"use client";

import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient as createBetterAuthClient } from "better-auth/react";

export function createAuthClient(options: { baseURL?: string } = {}) {
  return createBetterAuthClient({
    ...(options.baseURL ? { baseURL: options.baseURL } : {}),
    plugins: [usernameClient()],
  });
}

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
