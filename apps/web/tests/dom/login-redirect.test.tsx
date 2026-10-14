import { describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";

import { setInputValue } from "./set-input-value";

// Only the network boundary is replaced: the better-auth client is a stub that
// answers the sign-in calls. This file runs in its own bun process.
let signInError: { message: string } | null = null;
const signInResult = async () => ({ error: signInError });
mock.module("@infinitunes/auth/client", () => ({
  authClient: {
    signIn: {
      email: signInResult,
      passkey: signInResult,
      social: signInResult,
    },
  },
}));

const { LoginForm } = await import("../../app/(auth)/_components/login-form");

type Router = NonNullable<React.ContextType<typeof AppRouterContext>>;

const noop = () => {};

/** Fills the form, submits it and returns the router calls it triggered. */
async function signIn(
  search: string,
  error: { message: string } | null = null,
) {
  signInError = error;
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
          <LoginForm />
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    );
  });

  const email = container.querySelector<HTMLInputElement>(
    'input[autocomplete^="email"]',
  );
  const password = container.querySelector<HTMLInputElement>(
    'input[autocomplete^="current-password"]',
  );
  await act(async () => {
    if (email) setInputValue(email, "user@example.com");
    if (password) setInputValue(password, "Passw0rd!");
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

describe("login form post-success redirect", () => {
  it("navigates to the safe callbackUrl and refreshes after email sign in", async () => {
    expect(await signIn("callbackUrl=%2Flibrary")).toEqual([
      "push /library",
      "refresh",
    ]);
  });

  it("falls back to the legacy redirect param", async () => {
    expect(await signIn("redirect=%2Fme")).toEqual(["push /me", "refresh"]);
  });

  it("never follows an off-site callbackUrl", async () => {
    expect(await signIn("callbackUrl=https%3A%2F%2Fevil.example%2F")).toEqual([
      "push /",
      "refresh",
    ]);
    expect(await signIn("callbackUrl=%2F%2Fevil.example")).toEqual([
      "push /",
      "refresh",
    ]);
  });

  it("stays on the page when sign in fails", async () => {
    expect(
      await signIn("callbackUrl=%2Flibrary", { message: "Invalid" }),
    ).toEqual([]);
  });
});
