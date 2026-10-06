import { describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

import { PasswordField } from "../../app/(auth)/_components/password-field";

describe("auth password field (UI-22)", () => {
  it("keeps the visibility toggle keyboard reachable and operable", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <PasswordField
          field={{
            name: "password",
            value: "s3cret",
            onChange: () => {},
            onBlur: () => {},
            ref: () => {},
          }}
          fieldState={{} as never}
          label="Password"
          autoComplete="current-password"
          disabled={false}
        />,
      );
    });

    const toggle = container.querySelector(
      'button[aria-label="Show password"]',
    ) as HTMLElement;
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute("tabindex")).toBeNull();

    await act(async () => {
      toggle.click();
    });
    expect(
      container.querySelector('button[aria-label="Hide password"]'),
    ).not.toBeNull();
    expect(
      (
        container.querySelector(
          "input[autocomplete=current-password]",
        ) as HTMLInputElement
      ).type,
    ).toBe("text");
    root.unmount();
    container.remove();
  });
});
