import { afterEach, describe, expect, it } from "bun:test";

import { ThemeProvider } from "next-themes";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { ThemeToggleGroup } from "../../components/site-footer/theme-toggle-group";
import { THEME_SWITCHING_ATTRIBUTE } from "../../lib/theme/mode";

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

afterEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.style.colorScheme = "";
  document.documentElement.removeAttribute(THEME_SWITCHING_ATTRIBUTE);
});

describe("colour mode switch", () => {
  it("clicking Dark sets the class synchronously, before any await", async () => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.add("light");

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <ThemeToggleGroup />
        </ThemeProvider>,
      );
    });

    const dark = container.querySelector<HTMLElement>(
      'button[aria-label="Toggle Dark Mode"]',
    );
    expect(dark).not.toBeNull();

    // No act and no await: the page must already be dark when click() returns.
    dark?.click();
    const html = document.documentElement;
    expect(html.classList.contains("dark")).toBe(true);
    expect(html.classList.contains("light")).toBe(false);
    expect(html.style.colorScheme).toBe("dark");
    expect(html.hasAttribute(THEME_SWITCHING_ATTRIBUTE)).toBe(true);

    // The choice is persisted and the pressed segment follows once React has run.
    await act(async () => {});
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(dark?.getAttribute("aria-pressed")).toBe("true");
    expect(html.classList.contains("dark")).toBe(true);

    // Transitions stay off for one frame only.
    await act(async () => {
      await nextFrame();
      await nextFrame();
    });
    expect(html.hasAttribute(THEME_SWITCHING_ATTRIBUTE)).toBe(false);

    await act(async () => root.unmount());
    container.remove();
  });
});
