import { describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";

const social: unknown[] = [];
const toasts: string[] = [];
mock.module("@infinitunes/auth/client", () => ({
  authClient: {
    signIn: {
      social: async (body: unknown) => {
        social.push(body);
        return { error: null };
      },
    },
  },
}));
mock.module("sonner", () => ({
  toast: {
    success: (m: string) => toasts.push(m),
    error: (m: string) => toasts.push(m),
  },
}));

const { LoginForm } = await import("../../app/(auth)/_components/login-form");
const { ResetPasswordForm } =
  await import("../../app/(auth)/_components/reset-password-form");

type Router = NonNullable<React.ContextType<typeof AppRouterContext>>;
const noop = () => {};
const router: Router = {
  back: noop,
  forward: noop,
  refresh: noop,
  prefetch: noop,
  replace: noop,
  bfcacheId: "test",
  push: noop,
};

async function mount(search: string, form: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () =>
    root.render(
      <AppRouterContext.Provider value={router}>
        <SearchParamsContext.Provider value={new URLSearchParams(search)}>
          {form}
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    ),
  );
  return container;
}

describe("OAuth buttons", () => {
  it("carry the safe callback path and do not announce a sign-in early", async () => {
    const container = await mount("callbackUrl=%2Flibrary", <LoginForm />);
    const github = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("GitHub"),
    );
    await act(async () => github?.click());

    expect(social).toEqual([{ provider: "github", callbackURL: "/library" }]);
    expect(toasts).toEqual([]);
  });

  it("fall back to home for an unsafe callback", async () => {
    social.length = 0;
    const container = await mount(
      "callbackUrl=https%3A%2F%2Fevil.test",
      <LoginForm />,
    );
    const google = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Google"),
    );
    await act(async () => google?.click());

    expect(social).toEqual([{ provider: "google", callbackURL: "/" }]);
  });
});

describe("reset password hint", () => {
  it("states every rule the password schema enforces", async () => {
    const container = await mount("token=t", <ResetPasswordForm />);
    expect(container.textContent).toContain(
      "upper and lower case, a number and a symbol",
    );
  });
});
