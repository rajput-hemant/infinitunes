import { describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";

import { setInputValue } from "./set-input-value";

// Only the network boundary is replaced: the better-auth client is a stub that
// answers the sign-up call. This file runs in its own bun process.
let signUpError: { message: string } | null = null;
const signUpCalls: unknown[] = [];
mock.module("@infinitunes/auth/client", () => ({
  authClient: {
    signUp: {
      email: async (body: unknown) => {
        signUpCalls.push(body);
        return { error: signUpError };
      },
    },
    signIn: {
      social: async () => ({ error: null }),
      passkey: async () => ({ error: null }),
    },
  },
}));

const { SignUpForm } = await import("../../app/(auth)/_components/signup-form");

type Router = NonNullable<React.ContextType<typeof AppRouterContext>>;

const noop = () => {};

async function signUp(
  search: string,
  error: { message: string } | null = null,
) {
  signUpError = error;
  signUpCalls.length = 0;
  const calls: string[] = [];
  const router: Router = {
    back: noop,
    forward: noop,
    prefetch: noop,
    replace: noop,
    bfcacheId: "test",
    push: (href: string) => calls.push(`push ${href}`),
    refresh: () => calls.push("refresh"),
  };

  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <SearchParamsContext.Provider value={new URLSearchParams(search)}>
          <SignUpForm />
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    );
  });

  const email = container.querySelector<HTMLInputElement>(
    'input[autocomplete^="email"]',
  );
  const passwords = container.querySelectorAll<HTMLInputElement>(
    'input[autocomplete^="new-password"]',
  );
  await act(async () => {
    if (email) setInputValue(email, "user@example.com");
    for (const input of passwords) setInputValue(input, "Passw0rd!");
  });

  await act(async () => {
    container
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  await act(async () => root.unmount());
  container.remove();
  return calls;
}

describe("AU-4: sign-up auto sign-in redirect", () => {
  it("navigates to the safe callbackUrl and refreshes after a successful sign-up", async () => {
    expect(await signUp("callbackUrl=%2Flibrary")).toEqual([
      "push /library",
      "refresh",
    ]);
    expect(signUpCalls).toHaveLength(1);
  });

  it("falls back to the legacy redirect param", async () => {
    expect(await signUp("redirect=%2Fme")).toEqual(["push /me", "refresh"]);
  });

  it("never follows an off-site callbackUrl", async () => {
    expect(await signUp("callbackUrl=https%3A%2F%2Fevil.example%2F")).toEqual([
      "push /",
      "refresh",
    ]);
  });

  it("stays on the page when sign-up fails", async () => {
    expect(
      await signUp("callbackUrl=%2Flibrary", { message: "Taken" }),
    ).toEqual([]);
  });
});
