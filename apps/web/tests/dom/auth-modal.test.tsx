import { afterEach, describe, expect, it } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { AuthModal } from "../../app/@modal/auth-modal";

const roots: Root[] = [];

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
});

async function open(footer?: "login" | "signup") {
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
        <AuthModal
          title="Welcome back"
          description="Sign in to continue"
          footer={footer}
        >
          <input aria-label="Email" />
        </AuthModal>
      </AppRouterContext.Provider>,
    );
  });
  return calls;
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const buttons = () => [...(dialog()?.querySelectorAll("button") ?? [])];

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

  it.each([
    ["signup", "Sign up", "replace /signup"],
    ["login", "Login", "replace /login"],
  ])(
    "with footer %s the button is %s and calls %s",
    async (footer, label, call) => {
      const calls = await open(footer as "login" | "signup");
      const toggle = buttons().find((b) => b.textContent === label);

      expect(toggle).toBeDefined();
      await act(async () => toggle?.click());

      expect(calls).toEqual([call]);
    },
  );

  it("shows no switch line when the modal has no footer prop", async () => {
    await open();

    expect(dialog()?.textContent).not.toContain("account?");
  });

  it.each([
    ["signup", "Don't have an account?", "Sign up."],
    ["login", "Already have an account?", "Login."],
  ])(
    "with footer %s the text reads %s %s with no padding before the period",
    async (footer, lead, tail) => {
      await open(footer as "login" | "signup");
      const line = [...(dialog()?.querySelectorAll("p") ?? [])].at(-1);
      expect(line?.textContent?.replace(/\s+/g, " ").trim()).toBe(
        `${lead} ${tail}`,
      );
      const toggle = buttons().find((b) =>
        tail.startsWith(b.textContent ?? ""),
      );
      expect(toggle?.className).toContain("px-0");
    },
  );
});
