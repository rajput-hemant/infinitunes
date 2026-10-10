import { FilterCache } from "~/lib/glass/filter-cache";
import {
  DROPLET_MAGNIFY,
  MATERIALIZE_MS,
  bezelFor,
  canLens,
  easeOutCubic,
  lensKey,
  lensScale,
  lensStrength,
  specularSlope,
} from "~/lib/glass/lens-math";
import type { GlassSize } from "~/lib/glass/lens-math";
import { prefersReducedMotion } from "~/lib/glass/motion";
import { materializes } from "~/lib/glass/overlays";
import type { GlassRole } from "~/lib/glass/overlays";

import { encodeLensMaps } from "./lens-maps";
import type { LensMapEncoder } from "./lens-maps";

const SVG_NS = "http://www.w3.org/2000/svg";
/** Quiet period after a size change before the lens is rebuilt for the new size. */
const RESIZE_SETTLE_MS = 140;

type LensFilter = {
  element: SVGFilterElement;
  displacement: SVGFEDisplacementMapElement;
  specularAlpha: SVGFEFuncAElement;
  strength: number;
};

export type GlassTarget = {
  size: GlassSize;
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
};

export type LensConfig = {
  active: boolean;
  /** `--glass-refraction`, px. */
  refraction: number;
  /** `--glass-spec`. */
  spec: number;
};

const config: LensConfig = { active: false, refraction: 30, spec: 1 };
let encoder: LensMapEncoder = encodeLensMaps;

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

function setScale(filter: LensFilter, progress: number) {
  filter.displacement.setAttribute(
    "scale",
    lensScale(config.refraction, filter.strength, progress).toFixed(1),
  );
  filter.specularAlpha.setAttribute(
    "slope",
    specularSlope(config.spec).toFixed(2),
  );
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

function createFilter(
  id: string,
  width: number,
  height: number,
  radius: number,
  target: GlassTarget,
): LensFilter | null {
  const defs = document.querySelector("#lg-defs defs");
  if (!defs) return null;
  const magnify = Boolean(target.magnify);
  const maps = encoder({
    width,
    height,
    radius,
    bezel: bezelFor(width, height, radius, target.size),
    magnify: magnify ? DROPLET_MAGNIFY : 0,
  });
  if (!maps) return null;

  const box = { x: 0, y: 0, width, height, preserveAspectRatio: "none" };
  const element = svg("filter", {
    id,
    x: 0,
    y: 0,
    width,
    height,
    filterUnits: "userSpaceOnUse",
    primitiveUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  const displacement = svg("feDisplacementMap", {
    in: "SourceGraphic",
    in2: "map",
    scale: 0,
    xChannelSelector: "R",
    yChannelSelector: "G",
    result: "refr",
  });
  const specularAlpha = svg("feFuncA", { type: "linear", slope: 1 });
  const transfer = svg("feComponentTransfer", { in: "spec", result: "specA" });
  transfer.append(specularAlpha);

  const mapImage = svg("feImage", {
    ...box,
    href: maps.displacement,
    result: "map",
  });
  const specImage = svg("feImage", {
    ...box,
    href: maps.specular,
    result: "spec",
  });
  const blend = svg("feBlend", { in: "specA", in2: "refr", mode: "screen" });
  element.append(mapImage, displacement, specImage, transfer, blend);
  defs.append(element);

  const filter = {
    element,
    displacement,
    specularAlpha,
    strength: lensStrength(target.size, magnify),
  };
  return filter;
}

function clearLens(el: HTMLElement, entry: Entry) {
  el.style.removeProperty("--g-lens-url");
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
  const key = lensKey(
    width,
    height,
    radius,
    entry.target.size,
    Boolean(entry.target.magnify),
  );
  const hit = cache.getOrCreate(key, (id) =>
    createFilter(id, width, height, radius, entry.target),
  );
  if (!hit) {
    // No defs host or no canvas: leave the frosted path in place.
    clearLens(el, entry);
    return;
  }
  setScale(hit.value, 1);
  entry.applied = { id: hit.id, width, height };
  el.style.setProperty("--g-lens-url", `url(#${hit.id})`);
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
  if (drifted) clearLens(el, entry);
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => applyLens(el), applied ? RESIZE_SETTLE_MS : 0);
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
    });
    resizeObserver?.observe(el);
    schedule(el);
  }
  return () => unregisterGlass(el);
}

export function unregisterGlass(el: HTMLElement) {
  const entry = entries.get(el);
  if (!entry) return;
  clearTimeout(entry.timer);
  resizeObserver?.unobserve(el);
  el.style.removeProperty("--g-lens-url");
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
 * Applies a new engine state: toggles every lens on or off, and rescales the
 * cached filters when the refraction or highlight tuning changed.
 */
export function configureLens(next: Partial<LensConfig>) {
  const wasActive = config.active;
  Object.assign(config, next);
  cache.forEach(({ value }) => setScale(value, 1));
  if (config.active !== wasActive) {
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
  config.active = false;
  config.refraction = 30;
  config.spec = 1;
  encoder = encodeLensMaps;
}
