import { afterEach, beforeEach, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const router = { replace: mock(() => {}), refresh: mock(() => {}) };
type SignOutResult = { error: { message?: string } | null };
let failure: SignOutResult["error"] = null;
const signOut = mock(
  (options: {
    fetchOptions: { onSuccess: () => void };
  }): Promise<SignOutResult> => {
    // Like Better Auth: onSuccess only on success, and a failure resolves with `error`.
    if (!failure) options.fetchOptions.onSuccess();
    return Promise.resolve({ error: failure });
  },
);
// sonner handles the rejection itself (it shows the error toast); the fake only has to do the same.
const toastPromise = mock((promise: Promise<unknown>, _messages: unknown) => {
  promise.catch(() => {});
});

mock.module("next/navigation", () => ({ useRouter: () => router }));
mock.module("@infinitunes/auth/client", () => ({ authClient: { signOut } }));
mock.module("sonner", () => ({ toast: { promise: toastPromise } }));

const { useSignOut } = await import("../../hooks/use-sign-out");

let root: Root | undefined;

function Button() {
  const signOutNow = useSignOut();
  return <button onClick={() => signOutNow()}>Sign out</button>;
}

beforeEach(() => {
  router.replace.mockClear();
  router.refresh.mockClear();
  signOut.mockClear();
  toastPromise.mockClear();
  failure = null;
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
});

it("signs out, then replaces to /login and refreshes server data", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(<Button />));

  await act(async () => container.querySelector("button")?.click());

  expect(signOut).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledWith("/login");
  expect(router.refresh).toHaveBeenCalledTimes(1);
  expect(toastPromise.mock.calls[0]?.[1]).toEqual({
    loading: "Signing out...",
    success: "You have been signed out.",
    error: "Something went wrong.",
  });
});

it("rejects the toast promise and does not redirect when sign-out fails", async () => {
  failure = { message: "Network down" };
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(<Button />));

  await act(async () => container.querySelector("button")?.click());

  const promise = toastPromise.mock.calls[0]?.[0];
  await expect(promise).rejects.toThrow("Network down");
  expect(router.replace).not.toHaveBeenCalled();
  expect(router.refresh).not.toHaveBeenCalled();
});
