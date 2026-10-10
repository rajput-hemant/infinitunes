import { describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

const setTheme = mock((_theme: string) => {});
mock.module("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme }),
}));

const { ThemeToggleGroup } =
  await import("../../components/site-footer/theme-toggle-group");

describe("footer theme selection", () => {
  it("keeps the theme when the pressed segment is pressed again", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<ThemeToggleGroup />);
    });

    const dark = container.querySelector<HTMLElement>(
      'button[aria-label="Toggle Dark Mode"]',
    );
    const light = container.querySelector<HTMLElement>(
      'button[aria-label="Toggle Light Mode"]',
    );
    expect(dark?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => dark?.click());
    expect(setTheme).not.toHaveBeenCalled();

    await act(async () => light?.click());
    expect(setTheme).toHaveBeenCalledWith("light");

    await act(async () => root.unmount());
    container.remove();
  });
});
