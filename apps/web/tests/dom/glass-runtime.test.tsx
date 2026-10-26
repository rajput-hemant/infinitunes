import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { GlassRuntime } from "../../components/glass/glass-runtime";
import { GlassSurface } from "../../components/glass/glass-surface";
import {
  forEachGlass,
  resetGlassRegistry,
} from "../../components/glass/lens-registry";
import { waitFor } from "./wait-for";

const roots: Root[] = [];
const root = document.documentElement;

async function mountRuntime() {
  const container = document.createElement("div");
  document.body.append(container);
  const reactRoot = createRoot(container);
  roots.push(reactRoot);
  await act(async () => {
    reactRoot.render(<GlassRuntime />);
  });
  // The engine is its own chunk and starts on idle.
  await waitFor(() => root.hasAttribute("data-glass-engine"));
}

const registered = () => {
  const seen: HTMLElement[] = [];
  forEachGlass((el) => seen.push(el));
  return seen;
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 30));

beforeEach(() => {
  root.setAttribute("data-glass-level", "liquid");
});

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  resetGlassRegistry();
  document.body.replaceChildren();
  for (const name of [...root.getAttributeNames()]) root.removeAttribute(name);
  root.removeAttribute("style");
});

describe("GlassRuntime", () => {
  it("renders nothing and marks the engine on <html>", async () => {
    await mountRuntime();
    expect(document.body.querySelector("*")?.childElementCount).toBe(0);
    // happy-dom has no SVG filter primitives, so the frosted path is chosen.
    expect(root.getAttribute("data-glass-engine")).toBe("frost");
  });

  it("removes the engine attribute when it unmounts", async () => {
    await mountRuntime();
    await act(async () => roots.splice(0).forEach((r) => r.unmount()));
    expect(root.hasAttribute("data-glass-engine")).toBe(false);
  });

  it("leaves surfaces in the DOM to hydrate untouched, even ones added after it starts", async () => {
    const early = document.createElement("div");
    early.setAttribute("data-glass", "regular");
    early.setAttribute("data-glass-size", "m");
    document.body.append(early);
    await mountRuntime();

    // A streamed Suspense boundary reveals server HTML that React has not
    // hydrated yet; writing --g-lens-url onto it is a hydration mismatch.
    const late = document.createElement("div");
    late.setAttribute("data-glass", "clear");
    late.setAttribute("data-glass-size", "s");
    const wrapper = document.createElement("section");
    wrapper.append(late);
    document.body.append(wrapper);
    await flush();

    expect(registered()).not.toContain(early);
    expect(registered()).not.toContain(late);
    expect(late.style.getPropertyValue("--g-lens-url")).toBe("");
  });

  it("hydrates a surface streamed in after the runtime started without a mismatch", async () => {
    await mountRuntime();
    const html = renderToString(<GlassSurface size="s" glassRole="toolbar" />);
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = html;
    await flush();

    const errors: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => void errors.push(args);
    try {
      await act(async () => {
        roots.push(
          hydrateRoot(container, <GlassSurface size="s" glassRole="toolbar" />),
        );
      });
    } finally {
      console.error = original;
    }

    expect(errors).toEqual([]);
    expect(registered()).toEqual([container.firstElementChild as HTMLElement]);
  });

  it("registers a hydrated GlassSurface from its own effect, once the runtime has started", async () => {
    const html = renderToString(<GlassSurface size="s" glassRole="toolbar" />);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const surface = container.firstElementChild;
    expect(registered()).toEqual([]);

    await act(async () => {
      roots.push(
        hydrateRoot(container, <GlassSurface size="s" glassRole="toolbar" />),
      );
    });

    // The engine has not started yet: the surface waits, frosted.
    expect(registered()).toEqual([]);

    await mountRuntime();
    expect(registered()).toEqual([surface as HTMLElement]);
  });

  it("registers a popup that was already open when the runtime starts", async () => {
    const menu = document.createElement("div");
    menu.setAttribute("data-slot", "dropdown-menu-content");
    document.body.append(menu);

    await mountRuntime();
    expect(registered()).toContain(menu);
  });

  it("registers packages/ui popups by their data-slot, with no attributes of their own", async () => {
    await mountRuntime();
    const menu = document.createElement("div");
    menu.setAttribute("data-slot", "dropdown-menu-content");
    const toast = document.createElement("li");
    toast.setAttribute("data-sonner-toast", "");
    const tooltip = document.createElement("div");
    tooltip.setAttribute("data-slot", "tooltip-content");
    document.body.append(menu, toast, tooltip);
    await flush();

    const seen = registered();
    expect(seen).toContain(menu);
    expect(seen).toContain(toast);
    expect(seen).not.toContain(tooltip);
  });

  it("does not treat <html> as a surface when it still carries the legacy data-glass", async () => {
    root.setAttribute("data-glass", "liquid");
    await mountRuntime();
    expect(registered()).not.toContain(root);
  });

  it("stops tracking surfaces that leave the page", async () => {
    await mountRuntime();
    const el = document.createElement("div");
    el.setAttribute("data-slot", "dropdown-menu-content");
    document.body.append(el);
    await flush();
    expect(registered()).toContain(el);
    el.remove();
    await flush();
    expect(registered()).not.toContain(el);
  });

  it("press gel writes the glow origin in pixels and springs the press in", async () => {
    await mountRuntime();
    const host = document.createElement("div");
    host.setAttribute("data-glass", "regular");
    host.setAttribute("data-glass-size", "m");
    host.getBoundingClientRect = () => new DOMRect(100, 100, 200, 60);
    const button = document.createElement("button");
    Object.defineProperty(button, "offsetWidth", { value: 40 });
    host.append(button);
    document.body.append(host);
    await flush();

    const down = new MouseEvent("pointerdown", {
      bubbles: true,
      clientX: 130,
      clientY: 120,
    });
    button.dispatchEvent(down);
    expect(host.style.getPropertyValue("--g-px")).toBe("30px");
    expect(host.style.getPropertyValue("--g-py")).toBe("20px");
    await flush();
    expect(Number(host.style.getPropertyValue("--g-press"))).toBeGreaterThan(0);
    expect(button.style.scale).not.toBe("");
    // The control scales by at most 6px of its width.
    expect(Number(button.style.scale)).toBeLessThanOrEqual(1.15);

    window.dispatchEvent(new MouseEvent("pointerup"));
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(Number(host.style.getPropertyValue("--g-press"))).toBeLessThan(0.05);
  });

  it("press gel leaves no spring or window listener behind when the runtime unmounts mid-press", async () => {
    await mountRuntime();
    const host = document.createElement("div");
    host.setAttribute("data-glass", "regular");
    host.setAttribute("data-glass-size", "m");
    host.getBoundingClientRect = () => new DOMRect(0, 0, 200, 60);
    const button = document.createElement("button");
    Object.defineProperty(button, "offsetWidth", { value: 40 });
    host.append(button);
    document.body.append(host);
    await flush();

    button.dispatchEvent(
      new MouseEvent("pointerdown", {
        bubbles: true,
        clientX: 10,
        clientY: 10,
      }),
    );
    await flush();
    expect(host.style.getPropertyValue("--g-press")).not.toBe("");
    await act(async () => roots.splice(0).forEach((r) => r.unmount()));
    expect(host.style.getPropertyValue("--g-press")).toBe("");
    expect(button.style.scale).toBe("");
    // The spring is stopped: nothing writes the press again.
    await flush();
    expect(host.style.getPropertyValue("--g-press")).toBe("");
  });

  it("reads the level from the theme attribute: Solid turns the lens off", async () => {
    root.setAttribute("data-glass-level", "solid");
    await mountRuntime();
    expect(root.getAttribute("data-glass-engine")).toBe("frost");
  });
});
