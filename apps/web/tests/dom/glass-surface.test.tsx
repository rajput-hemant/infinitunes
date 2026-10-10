import { afterEach, describe, expect, it } from "bun:test";

import { act, createRef, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";

import { GlassSurface } from "../../components/glass/glass-surface";

const roots: Root[] = [];

async function renderSurface(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(ui);
  });
  const surface = container.firstElementChild;
  if (!surface) throw new Error("GlassSurface rendered nothing");
  return surface;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("GlassSurface", () => {
  it("renders the regular medium lens material by default", async () => {
    const surface = await renderSurface(<GlassSurface />);

    expect(surface.getAttribute("data-glass")).toBe("regular");
    expect(surface.getAttribute("data-glass-size")).toBe("m");
    expect(surface.getAttribute("data-lens")).toBe("on");
    expect(surface.hasAttribute("data-glass-role")).toBe(false);
    expect(surface.hasAttribute("data-glass-press")).toBe(false);
  });

  it("applies the requested variant, size, lens state and class name", async () => {
    const surface = await renderSurface(
      <GlassSurface
        variant="tinted"
        size="l"
        lens="off"
        className="test-class"
      />,
    );

    expect(surface.getAttribute("data-glass")).toBe("tinted");
    expect(surface.getAttribute("data-glass-size")).toBe("l");
    expect(surface.getAttribute("data-lens")).toBe("off");
    expect(surface.classList.contains("test-class")).toBe(true);
  });

  it("never refracts an xl surface", async () => {
    const surface = await renderSurface(<GlassSurface size="xl" />);
    expect(surface.getAttribute("data-lens")).toBe("off");
  });

  it("exposes its role and marks a pressable surface for the press gel", async () => {
    const surface = await renderSurface(
      <GlassSurface glassRole="player" interactive />,
    );
    expect(surface.getAttribute("data-glass-role")).toBe("player");
    expect(surface.getAttribute("data-glass-press")).toBe("true");
  });

  it("passes native props and children through", async () => {
    const surface = await renderSurface(
      <GlassSurface aria-label="Player" id="p">
        <span>inside</span>
      </GlassSurface>,
    );
    expect(surface.getAttribute("aria-label")).toBe("Player");
    expect(surface.id).toBe("p");
    expect(surface.textContent).toBe("inside");
  });

  it("renders as another element via render, merging class names", async () => {
    const ref = createRef<HTMLElement>();
    const surface = await renderSurface(
      <GlassSurface
        ref={ref}
        render={<nav className="render-class" aria-label="Main" />}
        className="props-class"
        size="s"
      >
        links
      </GlassSurface>,
    );
    expect(surface.tagName).toBe("NAV");
    expect(surface.getAttribute("aria-label")).toBe("Main");
    expect(surface.classList.contains("render-class")).toBe(true);
    expect(surface.classList.contains("props-class")).toBe(true);
    expect(surface.getAttribute("data-glass-size")).toBe("s");
    expect(surface.textContent).toBe("links");
    expect(ref.current).toBe(surface);
  });

  it("keeps the render element's own children when none are given", async () => {
    const surface = await renderSurface(
      <GlassSurface render={<section>own</section>} />,
    );
    expect(surface.textContent).toBe("own");
  });
});
