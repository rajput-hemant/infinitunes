import { FilterCache } from "~/lib/glass/filter-cache";
import {
  DROPLET_MAGNIFY,
  MATERIALIZE_MS,
  canLens,
  chromaScales,
  easeOutCubic,
  lensKey,
  lensScale,
  lensStrength,
} from "~/lib/glass/lens-math";
import type { GlassSize, LensShape } from "~/lib/glass/lens-math";
import { prefersReducedMotion } from "~/lib/glass/motion";
import { materializes } from "~/lib/glass/overlays";
import type { GlassRole } from "~/lib/glass/overlays";
import { inkOverflowOrigin } from "~/lib/glass/shadow-overflow";
import type { Origin } from "~/lib/glass/shadow-overflow";
import { DEFAULT_GLASS_TUNING, GLASS_PRESETS } from "~/lib/glass/tuning";
import type { GlassPresetId } from "~/lib/glass/tuning";

import { encodeLensMap } from "./lens-maps";
import type { LensMapEncoder } from "./lens-maps";

const SVG_NS = "http://www.w3.org/2000/svg";
/** Quiet period after a size change before the lens is rebuilt for the new size. */
const RESIZE_SETTLE_MS = 140;

type LensFilter = {
  element: SVGFilterElement;
  /** The red pass (or the only pass), and the green/blue pass when the filter is chromatic. */
  red: SVGFEDisplacementMapElement;
  rest: SVGFEDisplacementMapElement | null;
  /** The colour flood and the mix of tinted and plain refraction, present while the tint is on. */
  tint: { flood: SVGFEFloodElement; mix: SVGFECompositeElement } | null;
  strength: number;
  /** Tuning of a surface-level preset; `null` follows the global tuning. */
  fixed: LensShape["fixed"];
};

export type GlassTarget = {
  size: GlassSize;
  /** `data-glass-preset`: this surface's own tuning in place of the global one. */
  preset?: GlassPresetId;
  role?: GlassRole;
  /** The lifted selection droplet magnifies; a plain surface does not. */
  magnify?: boolean;
};

type Entry = {
  target: GlassTarget;
  applied: { id: string; width: number; height: number } | null;
  timer: ReturnType<typeof setTimeout> | undefined;
  /** Materialize ramp still to run on the first applied lens. */
  ramp: boolean;
  /** The lens was dropped for a size change and waits for the size to settle. */
  dropped: boolean;
};

export type LensConfig = {
  active: boolean;
  /** `--glass-depth`: the displacement scale at strength 1, px. */
  depth: number;
  /** `--glass-splay`, `--glass-feather`, `--glass-curve`: the rim shape the map is built from. */
  splay: number;
  feather: number;
  curve: number;
  /** `--glass-chroma`: 0 keeps the filter single-pass. */
  chroma: number;
  /** `--glass-tint` and `--glass-tint-c`: while above 0 the lens multiplies the backdrop by the colour. */
  tint: number;
  tintColor: string;
};

const DEFAULTS: LensConfig = {
  active: false,
  depth: DEFAULT_GLASS_TUNING.depth,
  splay: DEFAULT_GLASS_TUNING.splay,
  feather: DEFAULT_GLASS_TUNING.feather,
  curve: DEFAULT_GLASS_TUNING.curve,
  chroma: DEFAULT_GLASS_TUNING.chroma,
  tint: DEFAULT_GLASS_TUNING.tint,
  tintColor: DEFAULT_GLASS_TUNING.tintColor,
};
const config: LensConfig = { ...DEFAULTS };
let encoder: LensMapEncoder = encodeLensMap;

function shapeFor(target: GlassTarget): LensShape {
  const own = target.preset ? GLASS_PRESETS[target.preset].tuning : null;
  const source = own ?? config;
  return {
    splay: source.splay,
    feather: source.feather,
    curve: source.curve,
    chromatic: source.chroma > 0,
    tinted: source.tint > 0,
    fixed: own
      ? {
          depth: own.depth,
          chroma: own.chroma,
          tint: own.tint,
          tintColor: own.tintColor,
        }
      : null,
  };
}

const entries = new Map<HTMLElement, Entry>();

function liveIds(): Set<string> {
  const live = new Set<string>();
  for (const [el, entry] of entries) {
    if (el.isConnected && entry.applied) live.add(entry.applied.id);
  }
  return live;
}

const cache = new FilterCache<LensFilter>(
  undefined,
  (id) => liveIds().has(id),
  (_id, filter) => filter.element.remove(),
);

const resizeObserver =
  typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver((records) => {
        for (const record of records) {
          if (record.target instanceof HTMLElement) schedule(record.target);
        }
      });

if (typeof window !== "undefined") {
  // A resized window moves viewport-anchored surfaces without resizing them.
  window.addEventListener("resize", () =>
    entries.forEach((_, el) => schedule(el)),
  );
}

/**
 * The ink-overflow origin depends on where the surface sits, and an anchored
 * popup is positioned and animated in after it registers: re-read it once the
 * motion on the surface itself ends.
 */
function settled(event: Event) {
  if (
    event.target instanceof HTMLElement &&
    event.target === event.currentTarget
  ) {
    schedule(event.target);
  }
}

/** Writes the tint colour and its share into a tinted filter. */
function setTint(filter: LensFilter) {
  if (!filter.tint) return;
  const { tint, tintColor } = filter.fixed ?? config;
  filter.tint.flood.setAttribute("flood-color", tintColor);
  filter.tint.mix.setAttribute("k2", tint.toFixed(3));
  filter.tint.mix.setAttribute("k3", (1 - tint).toFixed(3));
}

function setScale(filter: LensFilter, progress: number) {
  const { depth, chroma } = filter.fixed ?? config;
  const scale = lensScale(depth, filter.strength, progress);
  if (filter.rest) {
    const { red, rest } = chromaScales(scale, chroma);
    filter.red.setAttribute("scale", red.toFixed(1));
    filter.rest.setAttribute("scale", rest.toFixed(1));
  } else {
    filter.red.setAttribute("scale", scale.toFixed(1));
  }
}

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) {
    node.setAttribute(name, String(value));
  }
  return node;
}

const CHANNEL_R = "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0";
const CHANNEL_GB = "0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0";

function displace(result: string): SVGFEDisplacementMapElement {
  return svg("feDisplacementMap", {
    in: "SourceGraphic",
    in2: "map",
    scale: 0,
    xChannelSelector: "R",
    yChannelSelector: "G",
    result,
  });
}

function createFilter(
  id: string,
  width: number,
  height: number,
  radius: number,
  origin: Origin,
  target: GlassTarget,
  shape: LensShape,
): LensFilter | null {
  const defs = document.querySelector("#lg-defs defs");
  if (!defs) return null;
  const magnify = Boolean(target.magnify);
  const map = encoder({
    width,
    height,
    radius,
    splay: shape.splay,
    feather: shape.feather,
    curve: shape.curve,
    magnify: magnify ? DROPLET_MAGNIFY : 0,
  });
  if (!map) return null;

  // Offset every primitive by -origin so the map sits on the border box (see inkOverflowOrigin).
  const element = svg("filter", {
    id,
    x: -origin.x,
    y: -origin.y,
    width,
    height,
    filterUnits: "userSpaceOnUse",
    primitiveUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  const mapImage = svg("feImage", {
    x: -origin.x,
    y: -origin.y,
    width,
    height,
    preserveAspectRatio: "none",
    href: map,
    result: "map",
  });
  const primitives: SVGElement[] = [mapImage];
  let red: SVGFEDisplacementMapElement;
  let rest: SVGFEDisplacementMapElement | null = null;
  if (!shape.chromatic) {
    // One pass, nothing else: a plain lens costs one displacement.
    red = displace("refr");
    primitives.push(red);
  } else {
    // Red takes the larger displacement, green and blue the smaller; alpha stays on both so the add survives.
    red = displace("dR");
    rest = displace("dGB");
    primitives.push(
      red,
      rest,
      svg("feColorMatrix", {
        in: "dR",
        type: "matrix",
        values: CHANNEL_R,
        result: "cR",
      }),
      svg("feColorMatrix", {
        in: "dGB",
        type: "matrix",
        values: CHANNEL_GB,
        result: "cGB",
      }),
      svg("feComposite", {
        in: "cR",
        in2: "cGB",
        operator: "arithmetic",
        k1: 0,
        k2: 1,
        k3: 1,
        k4: 0,
        result: "refr",
      }),
    );
  }

  let tint: LensFilter["tint"] = null;
  if (shape.tinted) {
    // The CodePen's tint: the refracted backdrop multiplied by the colour, mixed back with the plain one.
    const flood = svg("feFlood", {
      "flood-color": "#fff",
      "flood-opacity": 1,
      result: "tintColor",
    });
    const mix = svg("feComposite", {
      in: "multiplied",
      in2: "refr",
      operator: "arithmetic",
      k1: 0,
      k2: 0,
      k3: 1,
      k4: 0,
    });
    primitives.push(
      flood,
      svg("feBlend", {
        in: "refr",
        in2: "tintColor",
        mode: "multiply",
        result: "multiplied",
      }),
      mix,
    );
    tint = { flood, mix };
  }

  element.append(...primitives);
  defs.append(element);
  const filter = {
    element,
    red,
    rest,
    tint,
    strength: lensStrength(target.size, magnify),
    fixed: shape.fixed,
  };
  setTint(filter);
  return filter;
}

function clearLens(el: HTMLElement, entry: Entry) {
  el.style.removeProperty("--g-lens-url");
  el.style.removeProperty("--g-lens-tint");
  entry.applied = null;
}

function radiusOf(el: HTMLElement, width: number, height: number): number {
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return Math.round(Math.min(radius, width / 2, height / 2));
}

function applyLens(el: HTMLElement) {
  const entry = entries.get(el);
  if (!entry) return;
  entry.timer = undefined;
  entry.dropped = false;
  if (!el.isConnected) {
    unregisterGlass(el);
    return;
  }
  const width = Math.round(el.offsetWidth);
  const height = Math.round(el.offsetHeight);
  const wanted =
    config.active &&
    canLens({
      size: entry.target.size,
      width,
      height,
      off: el.dataset.lens === "off",
    });
  if (!wanted) {
    clearLens(el, entry);
    return;
  }
  const radius = radiusOf(el, width, height);
  const rect = el.getBoundingClientRect();
  const origin = inkOverflowOrigin(getComputedStyle(el).boxShadow, {
    x: rect.left,
    y: rect.top,
  });
  const shape = shapeFor(entry.target);
  const key = lensKey(
    width,
    height,
    radius,
    entry.target.size,
    Boolean(entry.target.magnify),
    shape,
    origin,
  );
  const hit = cache.getOrCreate(key, (id) =>
    createFilter(id, width, height, radius, origin, entry.target, shape),
  );
  if (!hit) {
    // No defs host or no canvas: leave the frosted path in place.
    clearLens(el, entry);
    return;
  }
  setScale(hit.value, 1);
  entry.applied = { id: hit.id, width, height };
  el.style.setProperty("--g-lens-url", `url(#${hit.id})`);
  // A tinted lens multiplies the backdrop itself, so the stylesheet's tint layer steps aside.
  el.style.setProperty("--g-lens-tint", hit.value.tint ? "1" : "0");
  if (entry.ramp) {
    entry.ramp = false;
    if (!prefersReducedMotion()) ramp(el, hit.value);
  }
}

function ramp(el: HTMLElement, filter: LensFilter) {
  let start: number | null = null;
  const step = (time: number) => {
    if (!el.isConnected || !el.style.getPropertyValue("--g-lens-url")) return;
    start ??= time;
    const k = Math.min(1, (time - start) / MATERIALIZE_MS);
    setScale(filter, easeOutCubic(k));
    if (k < 1) requestAnimationFrame(step);
  };
  setScale(filter, 0);
  requestAnimationFrame(step);
}

/**
 * Sizes change during layout transitions: drop the lens at once (a stale map
 * would shear the backdrop) and rebuild it once the size settles.
 */
function schedule(el: HTMLElement) {
  const entry = entries.get(el);
  if (!entry) return;
  const { applied } = entry;
  const drifted =
    applied !== null &&
    (Math.abs(applied.width - el.offsetWidth) > 1 ||
      Math.abs(applied.height - el.offsetHeight) > 1);
  if (drifted) {
    clearLens(el, entry);
    entry.dropped = true;
  }
  clearTimeout(entry.timer);
  // A dropped lens keeps waiting on every later frame of the same resize: the
  // lens of a surface that has not been sized yet is built at once, but one
  // that is mid-transition is rebuilt once, after the size stops moving.
  entry.timer = setTimeout(
    () => settleThenApply(el),
    applied || entry.dropped ? RESIZE_SETTLE_MS : 0,
  );
}

/** Layout properties whose transitions move a surface's size or place. */
const LAYOUT_TRANSITIONS = new Set([
  "width",
  "height",
  "margin-right",
  "margin-left",
  "left",
  "right",
  "inset-inline-start",
  "inset-inline-end",
]);

/** A layout transition is still running somewhere (a frame can outlast the quiet period). */
function layoutTransitionRunning(): boolean {
  if (
    typeof document.getAnimations !== "function" ||
    typeof CSSTransition === "undefined"
  ) {
    return false;
  }
  return document
    .getAnimations()
    .some(
      (animation) =>
        animation instanceof CSSTransition &&
        animation.playState === "running" &&
        LAYOUT_TRANSITIONS.has(animation.transitionProperty),
    );
}

/**
 * A slow frame can outlast the quiet period in the middle of a size
 * transition, and a lens built for an in-between size is thrown away on the
 * next frame: hold the rebuild until the transition has ended.
 */
function settleThenApply(el: HTMLElement) {
  const entry = entries.get(el);
  if (!entry) return;
  if (entry.dropped && layoutTransitionRunning()) {
    entry.timer = setTimeout(() => settleThenApply(el), RESIZE_SETTLE_MS / 2);
    return;
  }
  applyLens(el);
}

/**
 * Registers a glass surface: it gets a lens sized to it (when the engine is
 * active), the pointer light and the press gel. Idempotent; a second call
 * updates the target. Returns the unregister function.
 */
export function registerGlass(
  el: HTMLElement,
  target: GlassTarget,
): () => void {
  const existing = entries.get(el);
  if (existing) {
    existing.target = target;
    schedule(el);
  } else {
    entries.set(el, {
      target,
      applied: null,
      timer: undefined,
      ramp: materializes(target.role),
      dropped: false,
    });
    resizeObserver?.observe(el);
    el.addEventListener("animationend", settled);
    el.addEventListener("transitionend", settled);
    schedule(el);
  }
  return () => unregisterGlass(el);
}

function unregisterGlass(el: HTMLElement) {
  const entry = entries.get(el);
  if (!entry) return;
  clearTimeout(entry.timer);
  resizeObserver?.unobserve(el);
  el.removeEventListener("animationend", settled);
  el.removeEventListener("transitionend", settled);
  el.style.removeProperty("--g-lens-url");
  el.style.removeProperty("--g-lens-tint");
  entries.delete(el);
}

/** Drops surfaces that left the document without unregistering. */
export function pruneGlass() {
  for (const el of entries.keys()) {
    if (!el.isConnected) unregisterGlass(el);
  }
}

export function forEachGlass(
  visit: (el: HTMLElement, target: GlassTarget) => void,
) {
  entries.forEach((entry, el) => {
    if (el.isConnected) visit(el, entry.target);
  });
}

/**
 * Applies a new engine state: toggles every lens on or off, rebuilds the
 * lenses when the rim shape (or whether the filter is chromatic or tinted)
 * changed, and otherwise just rewrites the cached filters (depth, chroma
 * strength, tint colour and share).
 */
export function configureLens(next: Partial<LensConfig>) {
  const before = { ...config };
  Object.assign(config, next);
  const reshaped =
    config.splay !== before.splay ||
    config.feather !== before.feather ||
    config.curve !== before.curve ||
    config.chroma > 0 !== before.chroma > 0 ||
    config.tint > 0 !== before.tint > 0;
  cache.forEach(({ value }) => {
    setScale(value, 1);
    setTint(value);
  });
  if (config.active !== before.active || (config.active && reshaped)) {
    entries.forEach((_, el) => schedule(el));
  }
}

export function setLensMapEncoder(next: LensMapEncoder) {
  encoder = next;
}

/** Test seam: forget everything, including cached filters. */
export function resetGlassRegistry() {
  for (const el of [...entries.keys()]) unregisterGlass(el);
  cache.collect();
  Object.assign(config, DEFAULTS);
  encoder = encodeLensMap;
}
