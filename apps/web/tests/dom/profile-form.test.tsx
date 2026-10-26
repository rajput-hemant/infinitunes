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
const actionCalls: string[] = [];
mock.module("../../lib/actions", () => ({
  updateUser: async (input: { name: string }) => {
    actionCalls.push(`updateUser ${input.name}`);
    return { ok: true, data: {} };
  },
  requestEmailChange: async (input: {
    email: string;
    currentPassword?: string;
  }) => {
    actionCalls.push(
      `requestEmailChange ${input.email} ${input.currentPassword ?? ""}`,
    );
    return { ok: true, data: { pendingEmail: input.email } };
  },
  changePassword: async (input: { password: string; newPassword: string }) => {
    actionCalls.push(`changePassword ${input.password} ${input.newPassword}`);
    return { ok: true, data: {} };
  },
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
  it("shows the account initial and a non-submitting Change avatar action", async () => {
    const container = await mount();

    expect(findButton(container, "Change avatar").type).toBe("button");
    expect(container.textContent).toContain("A");
  });

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

  it("saves the profile on its own, leaving the password form untouched", async () => {
    const container = await mount();
    actionCalls.length = 0;

    const name = requireElement(
      container,
      "input[type=text]",
      HTMLInputElement,
    );
    await act(async () => setInputValue(name, "Ada L"));
    await act(async () => findButton(container, "Save profile").click());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(actionCalls).toEqual(["updateUser Ada L"]);
  });

  it("sends a new email through the verified flow and never updateUser", async () => {
    const container = await mount();
    actionCalls.length = 0;

    const email = requireElement(
      container,
      "input[type=email]",
      HTMLInputElement,
    );
    await act(async () => setInputValue(email, "new@example.com"));
    const current = requireElement(
      container,
      "input[autocomplete=current-password]",
      HTMLInputElement,
    );
    await act(async () => setInputValue(current, "hunter2hunter2"));
    await act(async () => findButton(container, "Save profile").click());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(actionCalls).toEqual([
      "requestEmailChange new@example.com hunter2hunter2",
    ]);
  });

  it("blocks the profile save on an invalid name without a password error", async () => {
    const container = await mount();
    actionCalls.length = 0;

    const name = requireElement(
      container,
      "input[type=text]",
      HTMLInputElement,
    );
    await act(async () => setInputValue(name, ""));
    await act(async () => findButton(container, "Save profile").click());

    expect(actionCalls).toEqual([]);
    expect(container.querySelectorAll("[data-invalid=true]").length).toBe(1);
  });

  it("asks for the new password before changing it", async () => {
    const container = await mount();
    actionCalls.length = 0;

    await act(async () => findButton(container, "Update password").click());

    expect(container.textContent).toContain("Enter a new password");
    expect(actionCalls).toEqual([]);
  });

  it("asks for the current password, then changes the password only", async () => {
    const container = await mount();
    actionCalls.length = 0;
    const fresh = requireElement(
      container,
      "input[autocomplete=new-password]",
      HTMLInputElement,
    );
    const current = requireElement(
      container,
      "input[autocomplete=current-password]",
      HTMLInputElement,
    );

    await act(async () => setInputValue(fresh, "Brand-new-pass1!"));
    await act(async () => findButton(container, "Update password").click());
    expect(container.textContent).toContain("Enter your current password");
    expect(actionCalls).toEqual([]);

    await act(async () => setInputValue(current, "Old-pass-123!"));
    await act(async () => findButton(container, "Update password").click());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(actionCalls).toEqual([
      "changePassword Old-pass-123! Brand-new-pass1!",
    ]);
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
