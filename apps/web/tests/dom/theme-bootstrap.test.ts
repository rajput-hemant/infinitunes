import { afterEach, describe, expect, it } from "bun:test";

import { DEFAULT_THEME_CONFIG } from "../../lib/theme-config";
import { THEME_BOOTSTRAP_SCRIPT } from "../../lib/theme-script";
import { serializeThemeCookie } from "../../lib/theme/cookie";
import { themeConfigToHtml } from "../../lib/theme/html";
import { MANAGED_ATTRIBUTES, MANAGED_VARIABLES } from "../../lib/theme/managed";

const run = () => new Function(THEME_BOOTSTRAP_SCRIPT)();
const setCookie = (raw: string) => {
  document.cookie = `theme-config=${encodeURIComponent(raw)}; path=/`;
};

// The color-scheme step always sets a class and `color-scheme`, and the queue
// step sets `data-queue`, the sidebar step `data-sidebar`; these are the parts only the appearance step can add.
const appliedByAppearance = () => [
  ...document.documentElement
    .getAttributeNames()
    .filter(
      (n) =>
        n !== "class" &&
        n !== "style" &&
        n !== "data-queue" &&
        n !== "data-sidebar",
    ),
  ...(document.documentElement.style.cssText.match(/--[a-z-]+(?=:)/g) ?? []),
];

afterEach(() => {
  document.cookie = "theme-config=; path=/; max-age=0";
  document.cookie = "sidebar_state=; path=/; max-age=0";
  localStorage.clear();
  const html = document.documentElement;
  for (const name of [...html.getAttributeNames()]) html.removeAttribute(name);
});

describe("theme bootstrap script", () => {
  it("applies the saved appearance to <html> before paint", () => {
    setCookie(
      serializeThemeCookie({
        ...DEFAULT_THEME_CONFIG,
        radius: 0.5,
        density: "compact",
        textSize: 18,
        reduceMotion: true,
        glassTuning: {
          ...DEFAULT_THEME_CONFIG.glassTuning,
          blur: 4,
          tint: 0.5,
          tintColor: "#ff6600",
        },
      }),
    );
    run();
    const html = document.documentElement;
    expect(html.getAttribute("data-density")).toBe("compact");
    expect(html.getAttribute("data-glass-tint")).toBe("on");
    expect(html.getAttribute("data-motion")).toBe("reduced");
    expect(html.style.getPropertyValue("--radius")).toBe("0.5rem");
    expect(html.style.getPropertyValue("--text-scale")).toBe("1.125");
    expect(html.style.getPropertyValue("--glass-blur")).toBe("4px");
    // A hex colour passes the value check, and the primary follows it.
    expect(html.style.getPropertyValue("--glass-tint-c")).toBe("#ff6600");
    expect(html.style.getPropertyValue("--light-primary")).toMatch(/^oklch/);
  });

  it("does nothing without a cookie", () => {
    run();
    expect(appliedByAppearance()).toEqual([]);
  });

  it("ignores a legacy cookie without the precomputed html field", () => {
    setCookie('{"theme":"rose","radius":0.5}');
    run();
    expect(appliedByAppearance()).toEqual([]);
  });

  it("ignores malformed cookies and unsafe names or values", () => {
    for (const raw of [
      "{not json",
      "null",
      '{"html":7}',
      '{"html":{"a":{"onclick":"x","data-x":"a b","data-ok":"<b>"},"s":{"color":"red","--x":"url(x)"}}}',
    ]) {
      setCookie(raw);
      run();
      expect(appliedByAppearance()).toEqual([]);
    }
  });

  it("allowlists exactly what themeConfigToHtml can emit", () => {
    const everything = themeConfigToHtml({
      ...DEFAULT_THEME_CONFIG,
      radius: 0.5,
      textSize: 18,
      glassTuning: {
        depth: 61,
        splay: 3,
        feather: 25,
        curve: 2.1,
        blur: 1,
        chroma: 0.05,
        glint: 30,
        tint: 0.3,
        tintColor: "#3a7bd5",
      },
    });
    expect(Object.keys(everything.attributes).sort()).toEqual(
      [...MANAGED_ATTRIBUTES].sort(),
    );
    expect(Object.keys(everything.style).sort()).toEqual(
      [...MANAGED_VARIABLES].sort(),
    );

    // The script embeds the same lists, so every emitted name is applied.
    setCookie(
      JSON.stringify({
        html: { a: everything.attributes, s: everything.style },
      }),
    );
    run();
    for (const name of MANAGED_ATTRIBUTES) {
      expect(document.documentElement.hasAttribute(name)).toBe(true);
    }
    for (const name of MANAGED_VARIABLES) {
      expect(document.documentElement.style.getPropertyValue(name)).not.toBe(
        "",
      );
    }
  });

  it("ignores well-formed names the appearance engine never emits", () => {
    // Closed queue: only a cookie could still put data-queue on <html>.
    localStorage.setItem("queue_open", "false");
    setCookie(
      JSON.stringify({
        html: {
          a: {
            "data-queue": "open",
            "data-glass-engine": "lens",
            "data-density": "compact",
          },
          s: { "--toast-offset-bottom": "10px", "--radius": "0.5rem" },
        },
      }),
    );
    run();
    const html = document.documentElement;
    expect(html.getAttribute("data-density")).toBe("compact");
    expect(html.style.getPropertyValue("--radius")).toBe("0.5rem");
    expect(html.hasAttribute("data-queue")).toBe(false);
    expect(html.hasAttribute("data-glass-engine")).toBe(false);
    expect(html.style.getPropertyValue("--toast-offset-bottom")).toBe("");
  });

  it("applies the stored light/dark choice like next-themes", () => {
    localStorage.setItem("theme", "dark");
    run();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("ignores unknown stored theme values", () => {
    localStorage.setItem("theme", "<script>");
    run();
    expect(document.documentElement.className).toBe("");
  });

  describe("collapsed sidebar flag", () => {
    const sidebarAttr = () =>
      document.documentElement.getAttribute("data-sidebar");

    it("flags a sidebar the visitor collapsed (the shadcn provider writes sidebar_state=false)", () => {
      document.cookie = "sidebar_state=false; path=/";
      run();
      expect(sidebarAttr()).toBe("collapsed");
    });

    it("leaves an open or unset sidebar alone", () => {
      run();
      expect(sidebarAttr()).toBeNull();
      document.cookie = "sidebar_state=true; path=/";
      run();
      expect(sidebarAttr()).toBeNull();
    });

    it("does not match a cookie that only ends in the name", () => {
      document.cookie = "other_sidebar_state=false; path=/";
      run();
      expect(sidebarAttr()).toBeNull();
      document.cookie = "other_sidebar_state=; path=/; max-age=0";
    });
  });

  describe("docked queue flag", () => {
    const queueAttr = () => document.documentElement.getAttribute("data-queue");

    it("leaves the queue closed when nothing is stored (closed is the default)", () => {
      run();
      expect(document.documentElement.hasAttribute("data-queue")).toBe(false);
    });

    it("marks the queue open when the stored flag is true", () => {
      localStorage.setItem("queue_open", "true");
      run();
      expect(queueAttr()).toBe("open");
    });

    it("leaves the attribute off when the user closed the queue", () => {
      localStorage.setItem("queue_open", "false");
      run();
      expect(document.documentElement.hasAttribute("data-queue")).toBe(false);
    });

    it("never throws when storage is unavailable", () => {
      const original = Object.getOwnPropertyDescriptor(
        globalThis,
        "localStorage",
      );
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        get() {
          throw new Error("blocked");
        },
      });
      try {
        expect(run).not.toThrow();
      } finally {
        if (original)
          Object.defineProperty(globalThis, "localStorage", original);
      }
    });
  });
});
