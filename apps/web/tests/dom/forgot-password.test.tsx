import { describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

// Only the network boundary is stubbed: the better-auth client answers the
// reset request with whatever `result` holds.
let result: { error: { status: number } | null } = { error: null };
const requests: unknown[] = [];
mock.module("@infinitunes/auth/client", () => ({
  authClient: {
    requestPasswordReset: async (body: unknown) => {
      requests.push(body);
      return result;
    },
  },
}));

const { ForgotPasswordForm, FORGOT_PASSWORD_MESSAGE } =
  await import("../../app/(auth)/_components/forgot-password-form");

function setValue(input: HTMLInputElement, value: string) {
  input.value = value;
  const tracker = Reflect.get(input, "_valueTracker") as
    | { setValue(v: string): void }
    | undefined;
  tracker?.setValue("");
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function submit(
  email: string,
  response: typeof result = { error: null },
) {
  result = response;
  requests.length = 0;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(<ForgotPasswordForm />));

  const input = container.querySelector<HTMLInputElement>(
    'input[type="email"]',
  );
  await act(async () => {
    if (input) setValue(input, email);
  });
  await act(async () => {
    container
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  const text = container.textContent ?? "";
  await act(async () => root.unmount());
  container.remove();
  return text;
}

describe("forgot password form", () => {
  it("shows the same generic message for any address", async () => {
    const known = await submit("known@example.com");
    const unknown = await submit("nobody@example.com");

    expect(known).toContain(FORGOT_PASSWORD_MESSAGE);
    expect(unknown).toBe(known);
    expect(FORGOT_PASSWORD_MESSAGE).toStartWith("If an account exists");
  });

  it("normalizes the email and asks for the reset page as the redirect", async () => {
    await submit("  User@Example.COM ");

    expect(requests).toEqual([
      { email: "user@example.com", redirectTo: "/reset-password" },
    ]);
  });

  it("does not call the API for an invalid email", async () => {
    const text = await submit("not-an-email");

    expect(requests).toEqual([]);
    expect(text).not.toContain(FORGOT_PASSWORD_MESSAGE);
  });

  it("keeps the form (no success message) when the request is throttled", async () => {
    const text = await submit("user@example.com", { error: { status: 429 } });

    expect(requests).toHaveLength(1);
    expect(text).not.toContain(FORGOT_PASSWORD_MESSAGE);
  });
});
