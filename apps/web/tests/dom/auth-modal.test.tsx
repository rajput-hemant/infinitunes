import { afterEach, describe, expect, it } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { AuthModal } from "../../app/@modal/auth-modal";

const roots: Root[] = [];

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
});

async function open() {
  const calls: string[] = [];
  const router = {
    back: () => calls.push("back"),
    replace: (href: string) => calls.push(`replace ${href}`),
  } as never;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <PathnameContext.Provider value="/login">
          <AuthModal title="Welcome back" description="Sign in to continue">
            <input aria-label="Email" />
          </AuthModal>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  return calls;
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const buttons = () => [...document.querySelectorAll("button")];

describe("auth modal close control", () => {
  it("offers exactly one labelled close control and no footer Close/Back", async () => {
    await open();

    expect(dialog()?.textContent).toContain("Welcome back");
    const labels = buttons().map(
      (b) => b.getAttribute("aria-label") ?? b.textContent?.trim() ?? "",
    );
    expect(labels.filter((l) => /close|back/i.test(l))).toHaveLength(1);
    expect(labels.filter((l) => /close/i.test(l))[0]).toMatch(/close/i);
  });

  it("navigates back when the close control is used", async () => {
    const calls = await open();
    const close = buttons().find((b) =>
      /close/i.test(b.getAttribute("aria-label") ?? b.textContent ?? ""),
    );

    await act(async () => close?.click());

    expect(calls).toEqual(["back"]);
  });

  it("switches to sign up from the footer link", async () => {
    const calls = await open();
    const signUp = buttons().find((b) => b.textContent === "Sign up");

    await act(async () => signUp?.click());

    expect(calls).toEqual(["replace /signup"]);
  });
});
