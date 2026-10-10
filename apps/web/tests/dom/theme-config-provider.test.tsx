import { describe, expect, it, mock } from "bun:test";

import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";

const saved: unknown[] = [];
mock.module("~/lib/theme/actions", () => ({
  saveThemeConfig: async (input: unknown) => void saved.push(input),
}));

const { ThemeConfigProvider } = await import("~/lib/theme/provider");
const { useThemeConfig } = await import("~/hooks/use-theme-config");
const { DEFAULT_THEME_CONFIG } = await import("~/lib/theme-config");

const probe: { api?: ReturnType<typeof useThemeConfig> } = {};
function Probe() {
  const current = useThemeConfig();
  useEffect(() => {
    probe.api = current;
  });
  return <span data-accent={current.config.accent} />;
}

function api() {
  if (!probe.api) throw new Error("Probe has not rendered");
  return probe.api;
}

describe("ThemeConfigProvider", () => {
  it("applies instantly, debounces the save, resets", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <ThemeConfigProvider initial={DEFAULT_THEME_CONFIG}>
          <Probe />
        </ThemeConfigProvider>,
      );
    });
    const html = document.documentElement;
    expect(html.getAttribute("data-density")).toBe("comfortable");
    await act(async () => {
      api().update({ density: "compact", radius: 0.5, accent: "blue" });
      api().update({ radius: 0.25 });
    });
    expect(html.getAttribute("data-density")).toBe("compact");
    expect(html.style.getPropertyValue("--radius")).toBe("0.25rem");
    expect(html.style.getPropertyValue("--light-primary")).toMatch(/^oklch/);
    expect(saved).toHaveLength(0);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(saved).toHaveLength(1);
    expect((saved[0] as { radius: number }).radius).toBe(0.25);
    expect(api().isDefault).toBe(false);
    await act(async () => {
      api().reset();
    });
    expect(html.getAttribute("data-density")).toBe("comfortable");
    expect(html.style.getPropertyValue("--radius")).toBe("");
    expect(html.style.getPropertyValue("--light-primary")).toBe("");
    expect(api().isDefault).toBe(true);
    // invalid patch is normalized
    await act(async () => {
      api().update({ textSize: 99 as never });
    });
    expect(api().config.textSize).toBe(16);
  });
});
