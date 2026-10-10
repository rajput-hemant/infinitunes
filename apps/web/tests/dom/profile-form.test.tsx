import { describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { setInputValue } from "./set-input-value";
import {
  createTestRouter,
  findButton,
  requireElement,
} from "./settings-test-utils";

// `server-only` throws outside the react-server condition; the actions behind
// the form only need it to import.
mock.module("server-only", () => ({}));

const calls: string[] = [];
mock.module("../../lib/actions", () => ({
  updateUser: async () => ({ ok: true, data: {} }),
  changePassword: async () => ({ ok: true, data: {} }),
  deleteUser: async () => ({ ok: true, data: { id: "u1" } }),
}));

const router = createTestRouter((call) => {
  calls.push(call);
});

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

    const names = [...container.querySelectorAll("form input")]
      .filter(
        (input): input is HTMLInputElement => input instanceof HTMLInputElement,
      )
      .map((input) => input.labels?.[0]?.textContent?.trim());

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
      requireElement(
        container,
        "input[autocomplete=current-password]",
        HTMLInputElement,
      ),
    ).toBeDefined();
    expect(
      requireElement(
        container,
        "input[autocomplete=new-password]",
        HTMLInputElement,
      ),
    ).toBeDefined();
  });

  it("keeps the password visibility toggle keyboard reachable", async () => {
    const container = await mount();

    const toggle = requireElement(
      container,
      'button[aria-label="Show Password"]',
      HTMLButtonElement,
    );
    expect(toggle.getAttribute("tabindex")).toBeNull();

    const input = requireElement(
      container,
      "input[autocomplete=new-password]",
      HTMLInputElement,
    );
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      setter?.call(input, "s3cret-new");
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    });

    const enabled = requireElement(
      container,
      'button[aria-label="Show Password"]',
      HTMLButtonElement,
    );
    await act(async () => {
      enabled.click();
    });
    expect(
      requireElement(
        container,
        'button[aria-label="Hide Password"]',
        HTMLButtonElement,
      ),
    ).toBeDefined();
    expect(
      requireElement(
        container,
        "input[autocomplete=new-password]",
        HTMLInputElement,
      ).type,
    ).toBe("text");
  });

  it("leaves the signed-in page once the account is deleted", async () => {
    const container = await mount();
    calls.length = 0;

    const open = findButton(container, "Delete Account");
    await act(async () => {
      open.click();
    });

    const dialog = requireElement(
      document,
      '[role="alertdialog"]',
      HTMLElement,
    );
    const password = requireElement(
      dialog,
      'input[type="password"]',
      HTMLInputElement,
    );
    const confirm = requireElement(
      dialog,
      'input[type="text"]',
      HTMLInputElement,
    );
    await act(async () => {
      setInputValue(password, "Secret-1234!");
      setInputValue(confirm, "DELETE MY ACCOUNT");
    });

    const action = findButton(dialog, "Delete Account");
    await act(async () => {
      action.click();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(calls).toEqual(["replace /", "refresh"]);
  });
});
