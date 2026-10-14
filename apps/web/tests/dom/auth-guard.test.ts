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
const { SignedInRedirect } =
  await import("../../app/(auth)/_components/signed-in-redirect");

beforeEach(() => {
  user = undefined;
  redirected.length = 0;
});

describe("signed-in users on auth pages", () => {
  it("are redirected home from a page without search params (login, signup)", async () => {
    user = { id: "u1" };
    await expect(SignedInRedirect({})).rejects.toThrow("NEXT_REDIRECT");
    expect(redirected).toEqual(["/"]);
  });

  it("may open an emailed reset link", async () => {
    user = { id: "u1" };
    await SignedInRedirect({ searchParams: Promise.resolve({ token: "t" }) });
    expect(redirected).toEqual([]);
  });

  it("are redirected from /reset-password without a token", async () => {
    user = { id: "u1" };
    await expect(
      SignedInRedirect({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirected).toEqual(["/"]);
  });

  it("signed-out visitors are never redirected", async () => {
    await SignedInRedirect({});
    await SignedInRedirect({ searchParams: Promise.resolve({}) });
    expect(redirected).toEqual([]);
  });
});
