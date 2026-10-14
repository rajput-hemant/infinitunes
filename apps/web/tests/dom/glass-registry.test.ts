import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import type { LensMapRequest } from "../../components/glass/lens-maps";
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

const sizes = new WeakMap<HTMLElement, { width: number; height: number }>();

function resize(el: HTMLElement, width: number, height: number) {
  const size = sizes.get(el);
  if (size) Object.assign(size, { width, height });
}

function surface(
  width: number,
  height: number,
  attrs: Record<string, string> = {},
) {
  const el = document.createElement("div");
  const size = { width, height };
  sizes.set(el, size);
  Object.defineProperty(el, "offsetWidth", { get: () => size.width });
  Object.defineProperty(el, "offsetHeight", { get: () => size.height });
  for (const [name, value] of Object.entries(attrs))
    el.setAttribute(name, value);
  document.body.append(el);
  return el;
}

let encodes = 0;
const requests: LensMapRequest[] = [];

beforeEach(() => {
  encodes = 0;
  requests.length = 0;
  setLensMapEncoder((request) => {
    encodes++;
    requests.push(request);
    return "data:image/png;base64,AA";
  });
});

afterEach(() => {
  resetGlassRegistry();
  document.body.replaceChildren();
});

const lensUrl = (el: HTMLElement) => el.style.getPropertyValue("--g-lens-url");
const filterOf = (defs: Element, el: HTMLElement) =>
  defs.querySelector(`#${lensUrl(el).slice(5, -1)}`);
const scaleOf = (defs: Element, el: HTMLElement) =>
  filterOf(defs, el)?.querySelector("feDisplacementMap")?.getAttribute("scale");

function register(el: HTMLElement, size: GlassSize = "m") {
  return registerGlass(el, { size });
}

describe("glass lens registry", () => {
  it("keeps the same filter, and never drops it, while a surface's content changes but its shape does not", async () => {
    const defs = addDefs();
    configureLens({ active: true });
    const el = surface(300, 60);
    register(el);
    await settle();
    const before = lensUrl(el);
    const built = encodes;
    const filters = defs.querySelectorAll("filter").length;
    const urlWrites: string[] = [];
    new MutationObserver(() => urlWrites.push(lensUrl(el))).observe(el, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // What playback does to the player: text and bar change, the box does not.
    for (let i = 0; i < 20; i++) {
      el.textContent = `00:${String(i).padStart(2, "0")}`;
      register(el);
      el.dispatchEvent(new Event("transitionend"));
      await settle(20);
    }
    await settle();

    expect(lensUrl(el)).toBe(before);
    expect(urlWrites.every((url) => url === before)).toBe(true);
    expect(encodes).toBe(built);
    expect(defs.querySelectorAll("filter").length).toBe(filters);
  });

  it("builds a lens at the depth scaled for the size once the engine is active", async () => {
    const defs = addDefs();
    configureLens({ active: true, depth: 60 });
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
  });

  it("builds a plain lens as one image and one displacement, nothing else", async () => {
    const defs = addDefs();
    configureLens({ active: true });
    const el = surface(300, 60);
    register(el);
    await settle();
    const filter = filterOf(defs, el);
    expect([...(filter?.children ?? [])].map((child) => child.tagName)).toEqual(
      ["feImage", "feDisplacementMap"],
    );
  });

  it("splits red from green and blue in two passes once chroma is above 0", async () => {
    const defs = addDefs();
    configureLens({ active: true, depth: 60, chroma: 0.1 });
    const el = surface(300, 60);
    register(el);
    await settle();
    const filter = filterOf(defs, el);
    const passes = [...(filter?.querySelectorAll("feDisplacementMap") ?? [])];
    expect(passes.map((pass) => pass.getAttribute("scale"))).toEqual([
      "49.5",
      "40.5",
    ]);
    expect(filter?.querySelector("feComposite")?.getAttribute("operator")).toBe(
      "arithmetic",
    );
  });

  it("adds no tint primitives while the tint is 0", async () => {
    const defs = addDefs();
    configureLens({ active: true, tint: 0, tintColor: "#ff6600" });
    const el = surface(300, 60);
    register(el);
    await settle();
    expect(filterOf(defs, el)?.querySelector("feFlood")).toBeNull();
    expect(el.style.getPropertyValue("--g-lens-tint")).toBe("0");
  });

  it("multiplies the refracted backdrop by the tint colour once the tint is on", async () => {
    const defs = addDefs();
    configureLens({ active: true, tint: 0.94, tintColor: "#ff6600" });
    const el = surface(300, 60);
    register(el);
    await settle();
    const filter = filterOf(defs, el);
    expect([...(filter?.children ?? [])].map((child) => child.tagName)).toEqual(
      ["feImage", "feDisplacementMap", "feFlood", "feBlend", "feComposite"],
    );
    expect(filter?.querySelector("feFlood")?.getAttribute("flood-color")).toBe(
      "#ff6600",
    );
    expect(filter?.querySelector("feBlend")?.getAttribute("mode")).toBe(
      "multiply",
    );
    const mix = filter?.querySelector("feComposite");
    expect(mix?.getAttribute("k2")).toBe("0.940");
    expect(mix?.getAttribute("k3")).toBe("0.060");
    // The stylesheet's own tint layer steps aside for this surface.
    expect(el.style.getPropertyValue("--g-lens-tint")).toBe("1");
  });

  it("rewrites the tint in place while it stays on, and rebuilds when it turns on or off", async () => {
    const defs = addDefs();
    configureLens({ active: true, tint: 0.5, tintColor: "#ff6600" });
    const el = surface(300, 60);
    register(el);
    await settle();
    const tinted = lensUrl(el);
    configureLens({ tint: 0.2, tintColor: "#2563eb" });
    expect(lensUrl(el)).toBe(tinted);
    expect(
      filterOf(defs, el)?.querySelector("feFlood")?.getAttribute("flood-color"),
    ).toBe("#2563eb");
    expect(
      filterOf(defs, el)?.querySelector("feComposite")?.getAttribute("k2"),
    ).toBe("0.200");
    configureLens({ tint: 0 });
    await settle();
    expect(lensUrl(el)).not.toBe(tinted);
    expect(filterOf(defs, el)?.querySelector("feFlood")).toBeNull();
  });

  it("builds the map from the rim shape settings", async () => {
    addDefs();
    configureLens({ active: true, splay: 12, feather: 30, curve: 1.4 });
    register(surface(300, 60));
    await settle();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      width: 300,
      height: 60,
      splay: 12,
      feather: 30,
      curve: 1.4,
      magnify: 0,
    });
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

  it("rescales cached filters in place when only the depth changes", async () => {
    const defs = addDefs();
    configureLens({ active: true, depth: 60 });
    const el = surface(300, 60);
    register(el);
    await settle();
    const before = lensUrl(el);
    expect(scaleOf(defs, el)).toBe("45.0");
    configureLens({ depth: 16 });
    expect(scaleOf(defs, el)).toBe("12.0");
    await settle();
    expect(lensUrl(el)).toBe(before);
    expect(encodes).toBe(1);
  });

  it("rebuilds the lens under a fresh filter id when the rim shape changes", async () => {
    const defs = addDefs();
    configureLens({ active: true });
    const el = surface(300, 60);
    register(el);
    await settle();
    const first = lensUrl(el);
    configureLens({ feather: 10 });
    await settle();
    expect(lensUrl(el)).not.toBe(first);
    expect(encodes).toBe(2);
    expect(requests[1]?.feather).toBe(10);
    expect(filterOf(defs, el)).not.toBeNull();
  });

  it("rebuilds the filter when chroma turns on, and keeps it when it only moves", async () => {
    addDefs();
    configureLens({ active: true });
    const el = surface(300, 60);
    register(el);
    await settle();
    const plain = lensUrl(el);
    configureLens({ chroma: 0.05 });
    await settle();
    const chromatic = lensUrl(el);
    expect(chromatic).not.toBe(plain);
    configureLens({ chroma: 0.2 });
    await settle();
    expect(lensUrl(el)).toBe(chromatic);
  });

  it("gives a surface with its own preset that preset's depth, whatever the page says", async () => {
    const defs = addDefs();
    configureLens({ active: true, depth: 60 });
    const el = surface(200, 40);
    registerGlass(el, { size: "s", preset: "thick" });
    await settle();
    expect(scaleOf(defs, el)).toBe("120.0");
    configureLens({ depth: 10 });
    expect(scaleOf(defs, el)).toBe("120.0");
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

  it("builds no lens until the surface has a valid size, then lenses it at its final size", async () => {
    const defs = addDefs();
    configureLens({ active: true });
    const el = surface(0, 0);
    register(el, "l");
    await settle();
    expect(lensUrl(el)).toBe("");
    expect(encodes).toBe(0);

    resize(el, 224, 133);
    register(el, "l");
    await settle();
    expect(lensUrl(el)).toMatch(/^url\(#lg-\d+\)$/);
    const id = lensUrl(el).slice(5, -1);
    expect(defs.querySelector(`#${id}`)?.getAttribute("width")).toBe("224");
    expect(defs.querySelector(`#${id}`)?.getAttribute("height")).toBe("133");
  });

  it("drops the lens when the size changes and rebuilds it for the new size", async () => {
    const defs = addDefs();
    configureLens({ active: true });
    const el = surface(200, 100);
    register(el, "l");
    await settle();
    const first = lensUrl(el);
    expect(first).not.toBe("");

    resize(el, 260, 100);
    register(el, "l");
    expect(lensUrl(el)).toBe("");
    await settle();
    const second = lensUrl(el);
    expect(second).not.toBe("");
    expect(second).not.toBe(first);
    expect(
      defs.querySelector(`#${second.slice(5, -1)}`)?.getAttribute("width"),
    ).toBe("260");
  });

  const SHADOW =
    "rgba(0, 0, 0, 0.34) 0px 30px 70px -18px, inset 0px 1px 1px 0px rgba(255, 255, 255, 0.5)";

  function placeAt(el: HTMLElement, left: number, top: number) {
    el.getBoundingClientRect = () => new DOMRect(left, top, 224, 133);
  }

  it("offsets the filter by how far the outer shadow reaches past the border box", async () => {
    const defs = addDefs();
    configureLens({ active: true });
    const el = surface(224, 133);
    el.style.boxShadow = SHADOW;
    placeAt(el, 500, 300);
    register(el, "l");
    await settle();
    const filter = defs.querySelector(`#${lensUrl(el).slice(5, -1)}`);
    expect(filter?.getAttribute("x")).toBe("-87");
    expect(filter?.getAttribute("y")).toBe("-57");
    expect(filter?.querySelector("feImage")?.getAttribute("x")).toBe("-87");
  });

  it("caps the offset by the distance to the viewport edge", async () => {
    const defs = addDefs();
    configureLens({ active: true });
    const el = surface(224, 133);
    el.style.boxShadow = SHADOW;
    placeAt(el, 1023, 48);
    register(el, "l");
    await settle();
    const filter = defs.querySelector(`#${lensUrl(el).slice(5, -1)}`);
    expect(filter?.getAttribute("x")).toBe("-87");
    expect(filter?.getAttribute("y")).toBe("-48");
  });

  it("re-reads the offset when the surface's motion ends", async () => {
    const defs = addDefs();
    configureLens({ active: true });
    const el = surface(224, 133);
    el.style.boxShadow = SHADOW;
    placeAt(el, 1023, 20);
    register(el, "l");
    await settle();
    const early = defs.querySelector(`#${lensUrl(el).slice(5, -1)}`);
    expect(early?.getAttribute("y")).toBe("-20");
    placeAt(el, 1023, 48);
    el.dispatchEvent(new Event("animationend"));
    await settle();
    const late = defs.querySelector(`#${lensUrl(el).slice(5, -1)}`);
    expect(late?.getAttribute("y")).toBe("-48");
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
