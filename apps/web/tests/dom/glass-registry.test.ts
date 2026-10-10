import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import {
  configureLens,
  forEachGlass,
  pruneGlass,
  registerGlass,
  resetGlassRegistry,
  setLensMapEncoder,
} from "../../components/glass/lens-registry";
import type { GlassSize } from "../../lib/glass/lens-math";

const settle = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

function addDefs() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "lg-defs";
  svg.append(document.createElementNS("http://www.w3.org/2000/svg", "defs"));
  document.body.append(svg);
  const defs = svg.querySelector("defs");
  if (!defs) throw new Error("no defs");
  return defs;
}

function surface(
  width: number,
  height: number,
  attrs: Record<string, string> = {},
) {
  const el = document.createElement("div");
  Object.defineProperty(el, "offsetWidth", { value: width });
  Object.defineProperty(el, "offsetHeight", { value: height });
  for (const [name, value] of Object.entries(attrs))
    el.setAttribute(name, value);
  document.body.append(el);
  return el;
}

let encodes = 0;

beforeEach(() => {
  encodes = 0;
  setLensMapEncoder(() => {
    encodes++;
    return {
      displacement: "data:image/png;base64,AA",
      specular: "data:image/png;base64,AA",
    };
  });
});

afterEach(() => {
  resetGlassRegistry();
  document.body.replaceChildren();
});

const lensUrl = (el: HTMLElement) => el.style.getPropertyValue("--g-lens-url");
const scaleOf = (defs: Element, el: HTMLElement) => {
  const id = lensUrl(el).slice(5, -1);
  return defs.querySelector(`#${id} feDisplacementMap`)?.getAttribute("scale");
};

function register(el: HTMLElement, size: GlassSize = "m") {
  return registerGlass(el, { size });
}

describe("glass lens registry", () => {
  it("builds a lens at the mockup scale for the size once the engine is active", async () => {
    const defs = addDefs();
    configureLens({ active: true, refraction: 30, spec: 1 });
    const small = surface(200, 40);
    const medium = surface(300, 60);
    const large = surface(300, 200);
    register(small, "s");
    register(medium, "m");
    register(large, "l");
    await settle();

    expect(scaleOf(defs, small)).toBe("60.0");
    expect(scaleOf(defs, medium)).toBe("45.0");
    expect(scaleOf(defs, large)).toBe("27.0");
    expect(defs.querySelector("feFuncA")?.getAttribute("slope")).toBe("0.80");
  });

  it("never lenses xl, tiny, huge or opted-out surfaces", async () => {
    addDefs();
    configureLens({ active: true });
    const xl = surface(300, 600);
    const tiny = surface(6, 6);
    const huge = surface(1200, 800);
    const off = surface(300, 60, { "data-lens": "off" });
    register(xl, "xl");
    for (const el of [tiny, huge, off]) register(el);
    await settle();
    for (const el of [xl, tiny, huge, off]) expect(lensUrl(el)).toBe("");
  });

  it("does nothing while the engine is inactive", async () => {
    addDefs();
    const el = surface(300, 60);
    register(el);
    await settle();
    expect(lensUrl(el)).toBe("");
    expect(encodes).toBe(0);
  });

  it("applies the lens when the engine turns on and drops it when it turns off", async () => {
    addDefs();
    const el = surface(300, 60);
    register(el);
    configureLens({ active: true });
    await settle();
    expect(lensUrl(el)).toMatch(/^url\(#lg-\d+\)$/);
    configureLens({ active: false });
    await settle();
    expect(lensUrl(el)).toBe("");
  });

  it("rescales cached filters when the refraction or highlight tuning changes", async () => {
    const defs = addDefs();
    configureLens({ active: true, refraction: 30 });
    const el = surface(300, 60);
    register(el);
    await settle();
    expect(scaleOf(defs, el)).toBe("45.0");
    configureLens({ refraction: 8, spec: 0.6 });
    expect(scaleOf(defs, el)).toBe("12.0");
    expect(defs.querySelector("feFuncA")?.getAttribute("slope")).toBe("0.48");
  });

  it("shares one filter, and one map render, between surfaces of the same size", async () => {
    const defs = addDefs();
    configureLens({ active: true });
    const a = surface(300, 60);
    const b = surface(300, 60);
    register(a);
    register(b);
    await settle();
    expect(lensUrl(a)).toBe(lensUrl(b));
    expect(defs.querySelectorAll("filter")).toHaveLength(1);
    expect(encodes).toBe(1);
  });

  it("stays frosted when there is no SVG host", async () => {
    configureLens({ active: true });
    const el = surface(300, 60);
    register(el);
    await settle();
    expect(lensUrl(el)).toBe("");
  });

  it("ramps a menu's lens in from zero (materialize)", async () => {
    const defs = addDefs();
    configureLens({ active: true });
    const menu = surface(300, 200);
    registerGlass(menu, { size: "l", role: "menu" });
    await settle(60);
    // Mid-ramp the scale is below its resting value; later it settles.
    expect(Number(scaleOf(defs, menu))).toBeLessThan(27);
    await settle(500);
    expect(scaleOf(defs, menu)).toBe("27.0");
  });

  it("unregisters and prunes surfaces that leave the document", async () => {
    addDefs();
    configureLens({ active: true });
    const kept = surface(300, 60);
    const gone = surface(300, 60);
    register(kept);
    register(gone);
    gone.remove();
    pruneGlass();
    const seen: HTMLElement[] = [];
    forEachGlass((el) => seen.push(el));
    expect(seen).toEqual([kept]);
  });

  it("stops observing when the returned function is called", async () => {
    addDefs();
    configureLens({ active: true });
    const el = surface(300, 60);
    const stop = register(el);
    await settle();
    stop();
    expect(lensUrl(el)).toBe("");
    const seen: HTMLElement[] = [];
    forEachGlass((e) => seen.push(e));
    expect(seen).toEqual([]);
  });
});
