import { beforeEach, describe, expect, it, mock } from "bun:test";

let user: { id: string } | undefined;
const redirected: string[] = [];

mock.module("server-only", () => ({}));
mock.module("~/lib/auth", () => ({ getUser: async () => user }));
mock.module("next/navigation", () => ({
  redirect: (to: string) => {
    redirected.push(to);
    throw new Error("NEXT_REDIRECT");
  },
}));
mock.module("../app/(auth)/_components/login-form", () => ({
  LoginForm: () => null,
}));
mock.module("../app/(auth)/_components/reset-password-form", () => ({
  ResetPasswordForm: () => null,
}));

const { default: LoginPage } = await import("../app/(auth)/login/page");
const { default: ResetPasswordPage } =
  await import("../app/(auth)/reset-password/page");

beforeEach(() => {
  user = undefined;
  redirected.length = 0;
});

describe("signed-in users on auth pages", () => {
  it("are redirected home from the login page", async () => {
    user = { id: "u1" };
    await expect(LoginPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirected).toEqual(["/"]);
  });

  it("may open an emailed reset link", async () => {
    user = { id: "u1" };
    await ResetPasswordPage({ searchParams: Promise.resolve({ token: "t" }) });
    expect(redirected).toEqual([]);
  });

  it("are redirected from /reset-password without a token", async () => {
    user = { id: "u1" };
    await expect(
      ResetPasswordPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirected).toEqual(["/"]);
  });

  it("signed-out visitors are never redirected", async () => {
    await LoginPage();
    await ResetPasswordPage({ searchParams: Promise.resolve({}) });
    expect(redirected).toEqual([]);
  });
});
