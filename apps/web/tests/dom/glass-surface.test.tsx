import { afterEach, describe, expect, it } from "bun:test";

import { act, type ReactElement } from "react";
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
});
