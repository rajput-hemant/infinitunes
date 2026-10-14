import { describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

import { ThemeToggleGroup } from "../../components/site-footer/theme-toggle-group";
import { controlStyles } from "../../lib/control-styles";

describe("footer theme buttons (UI-32)", () => {
  it("renders three labelled 44px targets with roving tab stops", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<ThemeToggleGroup />);
    });

    const buttons = [
      "Toggle Light Mode",
      "Toggle System Mode",
      "Toggle Dark Mode",
    ].map((label) => {
      const button = container.querySelector(
        `button[aria-label="${label}"]`,
      ) as HTMLElement;
      expect(button).not.toBeNull();
      return button;
    });

    // Touch size comes from the shared control contract (no shadcn edits).
    for (const button of buttons) {
      const classes = button.className.split(" ");
      for (const cls of controlStyles.headerIcon.split(" ")) {
        expect(classes).toContain(cls);
      }
    }

    // Roving tabindex (Base UI toggle-group arrow-key pattern): exactly one
    // stop is tabbable, the pressed state is exposed for the rest.
    const tabbables = buttons.filter(
      (button) => button.getAttribute("tabindex") !== "-1",
    );
    expect(tabbables).toHaveLength(1);
    for (const button of buttons) {
      expect(button.getAttribute("aria-pressed")).not.toBeNull();
    }
    root.unmount();
    container.remove();
  });
});
