import { describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";

import { setInputValue } from "./set-input-value";

let result: { error: { status?: number; code?: string } | null } = {
  error: null,
};
const requests: unknown[] = [];
mock.module("@infinitunes/auth/client", () => ({
  authClient: {
    resetPassword: async (body: unknown) => {
      requests.push(body);
      return result;
    },
  },
}));

const { ResetPasswordForm } =
  await import("../../app/(auth)/_components/reset-password-form");

type Router = NonNullable<React.ContextType<typeof AppRouterContext>>;

async function mount(search: string) {
  const pushes: string[] = [];
  const router = {
    push: (href: string) => pushes.push(href),
  } as unknown as Router;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () =>
    root.render(
      <AppRouterContext.Provider value={router}>
        <SearchParamsContext.Provider value={new URLSearchParams(search)}>
          <ResetPasswordForm />
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    ),
  );
  return { container, pushes, unmount: () => act(async () => root.unmount()) };
}

async function fillAndSubmit(
  container: HTMLElement,
  password: string,
  confirm: string,
) {
  const [first, second] = container.querySelectorAll<HTMLInputElement>(
    'input[autocomplete="new-password"]',
  );
  await act(async () => {
    if (first) setInputValue(first, password);
    if (second) setInputValue(second, confirm);
  });
  await act(async () => {
    container
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
}

const STRONG = "NewPassword1!";

describe("reset password form", () => {
  it("shows an invalid-link message with a request-again link when there is no token", async () => {
    const { container, unmount } = await mount("");

    expect(container.querySelector("form")).toBeNull();
    expect(container.textContent).toContain("invalid or has expired");
    expect(
      container.querySelector('a[href="/forgot-password"]')?.textContent,
    ).toContain("Request a new link");
    await unmount();
  });

  it("treats the INVALID_TOKEN redirect error as an invalid link", async () => {
    const { container, unmount } = await mount("error=INVALID_TOKEN");

    expect(container.querySelector("form")).toBeNull();
    expect(
      container.querySelector('a[href="/forgot-password"]'),
    ).not.toBeNull();
    await unmount();
  });

  it("submits the token with the new password and sends the user to login", async () => {
    result = { error: null };
    requests.length = 0;
    const { container, pushes, unmount } = await mount("token=abc123");

    await fillAndSubmit(container, STRONG, STRONG);

    expect(requests).toEqual([{ newPassword: STRONG, token: "abc123" }]);
    expect(pushes).toEqual(["/login"]);
    await unmount();
  });

  it("does not submit when the confirmation differs", async () => {
    requests.length = 0;
    const { container, pushes, unmount } = await mount("token=abc123");

    await fillAndSubmit(container, STRONG, "Different1!");

    expect(requests).toEqual([]);
    expect(pushes).toEqual([]);
    expect(container.textContent).toContain("Passwords do not match");
    await unmount();
  });

  it("switches to the invalid-link state when the server rejects the token", async () => {
    result = { error: { status: 400, code: "INVALID_TOKEN" } };
    requests.length = 0;
    const { container, pushes, unmount } = await mount("token=used");

    await fillAndSubmit(container, STRONG, STRONG);

    expect(requests).toHaveLength(1);
    expect(pushes).toEqual([]);
    expect(container.textContent).toContain("invalid or has expired");
    await unmount();
  });
});
