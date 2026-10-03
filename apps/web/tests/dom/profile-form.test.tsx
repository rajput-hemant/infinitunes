import { describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

// `server-only` throws outside the react-server condition; the actions behind
// the form only need it to import, nothing here submits.
mock.module("server-only", () => ({}));

const { ProfileForm } =
  await import("../../app/(root)/settings/_components/profile-form");

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <ProfileForm
        user={{ id: "u1", name: "Ada", email: "ada@example.com" }}
      />,
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
});
