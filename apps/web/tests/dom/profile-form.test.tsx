import { describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";

import { setInputValue } from "./set-input-value";

// `server-only` throws outside the react-server condition; the actions behind
// the form only need it to import.
mock.module("server-only", () => ({}));

const calls: string[] = [];
mock.module("../../lib/actions", () => ({
  updateUser: async () => ({ ok: true, data: {} }),
  changePassword: async () => ({ ok: true, data: {} }),
  deleteUser: async () => ({ ok: true, data: { id: "u1" } }),
}));

const router = {
  push: (href: string) => calls.push(`push ${href}`),
  replace: (href: string) => calls.push(`replace ${href}`),
  refresh: () => calls.push("refresh"),
  back() {},
  forward() {},
  prefetch() {},
} as unknown as NonNullable<React.ContextType<typeof AppRouterContext>>;

const { ProfileForm } =
  await import("../../app/(root)/settings/_components/profile-form");
const { DeleteAccountSection } =
  await import("../../app/(root)/settings/_components/delete-account-section");

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <ProfileForm
          user={{ id: "u1", name: "Ada", email: "ada@example.com" }}
        />
        <DeleteAccountSection />
      </AppRouterContext.Provider>,
    );
  });
  return container;
}

describe("profile form accessibility", () => {
  it("associates every visible label with its input", async () => {
    const container = await mount();

    const names = [...container.querySelectorAll("form input")].map((input) => {
      const el = input as HTMLInputElement;
      return el.labels?.[0]?.textContent?.trim();
    });

    expect(names).toEqual([
      "Name",
      "Email",
      "Current Password",
      "New Password",
    ]);
  });

  it("keeps autocomplete hints on the password fields", async () => {
    const container = await mount();

    expect(
      container.querySelector("input[autocomplete=current-password]"),
    ).not.toBeNull();
    expect(
      container.querySelector("input[autocomplete=new-password]"),
    ).not.toBeNull();
  });

  it("keeps the password visibility toggle keyboard reachable", async () => {
    const container = await mount();

    const toggle = container.querySelector(
      'button[aria-label="Show Password"]',
    ) as HTMLElement;
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute("tabindex")).toBeNull();

    const input = container.querySelector(
      "input[autocomplete=new-password]",
    ) as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      setter?.call(input, "s3cret-new");
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    });

    const enabled = container.querySelector(
      'button[aria-label="Show Password"]',
    ) as HTMLElement;
    await act(async () => {
      enabled.click();
    });
    expect(
      container.querySelector('button[aria-label="Hide Password"]'),
    ).not.toBeNull();
    expect(
      (
        container.querySelector(
          "input[autocomplete=new-password]",
        ) as HTMLInputElement
      ).type,
    ).toBe("text");
  });

  it("leaves the signed-in page once the account is deleted", async () => {
    const container = await mount();
    calls.length = 0;

    const open = [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "Delete Account",
    ) as HTMLButtonElement;
    await act(async () => {
      open.click();
    });

    const password = document.querySelector(
      '[role="alertdialog"] input[type="password"]',
    ) as HTMLInputElement;
    const confirm = document.querySelector(
      '[role="alertdialog"] input[type="text"]',
    ) as HTMLInputElement;
    await act(async () => {
      setInputValue(password, "Secret-1234!");
      setInputValue(confirm, "DELETE MY ACCOUNT");
    });

    const action = [
      ...document.querySelectorAll('[role="alertdialog"] button'),
    ].find(
      (b) => b.textContent?.trim() === "Delete Account",
    ) as HTMLButtonElement;
    await act(async () => {
      action.click();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(calls).toEqual(["replace /", "refresh"]);
  });
});
