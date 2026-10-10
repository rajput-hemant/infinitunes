import { describe, expect, it } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { PreferenceSettings } from "../../app/(root)/settings/_components/preference-settings";

describe("settings touch targets", () => {
  it("gives preference controls a fixed 44px height", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    await act(async () => {
      createRoot(container).render(
        <AppRouterContext.Provider value={{ refresh() {} } as never}>
          <PreferenceSettings initialLanguages={[]} />
        </AppRouterContext.Provider>,
      );
    });

    const controls = container.querySelectorAll("button");
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.className).toContain("h-11");
      expect(control.className).not.toContain("lg:min-h-0");
    }
  });
});
