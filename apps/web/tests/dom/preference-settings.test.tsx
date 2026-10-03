import { describe, expect, it } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { PreferenceSettings } from "../../app/(root)/settings/_components/preference-settings";

describe("keyboard shortcuts setting", () => {
  it("is a labelled switch that toggles the stored preference", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={{ refresh() {} } as never}>
          <PreferenceSettings initialLanguages={[]} />
        </AppRouterContext.Provider>,
      );
    });

    const toggle = container.querySelector(
      "[role=switch][aria-labelledby=keyboard-shortcuts-label]",
    ) as HTMLElement;
    expect(toggle).not.toBeNull();
    expect(
      document.getElementById("keyboard-shortcuts-label")?.textContent,
    ).toBe("Keyboard shortcuts");

    const before = toggle.getAttribute("aria-checked");
    await act(async () => toggle.click());
    expect(toggle.getAttribute("aria-checked")).not.toBe(before);
  });
});
