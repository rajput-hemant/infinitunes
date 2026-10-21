import { GLASS_LEVELS } from "@infinitunes/types";
import type { GlassLevel } from "@infinitunes/types";

import { lensActive, lensCapable } from "~/lib/glass/capabilities";
import type { GlassEngine } from "~/lib/glass/capabilities";
import type { GlassSize } from "~/lib/glass/lens-math";
import {
  OVERLAY_SELECTOR,
  isGlassRole,
  overlayTargetFor,
} from "~/lib/glass/overlays";
import { DEFAULT_GLASS_TUNING, GLASS_PRESET_IDS } from "~/lib/glass/tuning";

import { sampleBehind } from "./artwork-sampler";
import type { GlassTarget } from "./lens-registry";
import { configureLens, pruneGlass, registerGlass } from "./lens-registry";
import { installPressGel } from "./press-gel";

function isSize(value: string | undefined): value is GlassSize {
  return value === "s" || value === "m" || value === "l" || value === "xl";
}

function levelOf(root: HTMLElement): GlassLevel {
  const value = root.getAttribute("data-glass-level");
  return GLASS_LEVELS.find((level) => level === value) ?? "liquid";
}

function numberVar(style: CSSStyleDeclaration, name: string, fallback: number) {
  const value = parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function colorVar(style: CSSStyleDeclaration, name: string, fallback: string) {
  const value = style.getPropertyValue(name).trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

/** The registry target for an element: its own attributes, else the overlay slot it is. */
export function targetFor(el: HTMLElement): GlassTarget | null {
  const overlay = overlayTargetFor(el);
  const size = isSize(el.dataset.glassSize)
    ? el.dataset.glassSize
    : overlay?.size;
  if (!size) return null;
  const role = isGlassRole(el.dataset.glassRole)
    ? el.dataset.glassRole
    : overlay?.role;
  const preset = GLASS_PRESET_IDS.find((id) => id === el.dataset.glassPreset);
  return { size, role, preset };
}

/**
 * Registers one surface with the lens registry. React-rendered surfaces call
 * this from their own effect (see `useGlassRegistration`), which only runs once
 * that surface is hydrated: the lens writes `--g-lens-url` onto the element,
 * and doing that to server HTML React has not reached yet is a hydration
 * attribute mismatch.
 */
export function register(el: HTMLElement) {
  const target = targetFor(el);
  if (!target) return;
  registerGlass(el, target);
  if (el.dataset.glass === "clear") sampleBehind(el);
}

/**
 * Only popups are picked up from the DOM. Anything else that is added can be
 * server HTML that React streamed in (a Suspense boundary revealing) and has
 * not hydrated yet: writing `--g-lens-url` onto it makes its hydration report
 * a style mismatch. Surfaces register from their own effect instead.
 */
function registerWithin(node: Node) {
  if (!(node instanceof HTMLElement)) return;
  if (node.matches(OVERLAY_SELECTOR)) register(node);
  node.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR).forEach(register);
}

export { registerGlass };

let running = false;

/** True between `startGlassRuntime` and its teardown. */
export function isRunning() {
  return running;
}

/**
 * Starts the glass engine for the document: capability detection (sets
 * `html[data-glass-engine]`), surface discovery for every `data-glass` surface
 * and `packages/ui` popup, the lens lifecycle and press gel.
 * One instance per page; returns the teardown.
 */
export function startGlassRuntime(): () => void {
  running = true;
  const root = document.documentElement;
  const capable = lensCapable();
  const transparency = window.matchMedia(
    "(prefers-reduced-transparency: reduce)",
  );
  const contrast = window.matchMedia("(prefers-contrast: more)");
  const forced = window.matchMedia("(forced-colors: active)");

  const evaluate = () => {
    const active = lensActive({
      capable,
      level: levelOf(root),
      reducedTransparency: transparency.matches,
      highContrast: contrast.matches,
      forcedColors: forced.matches,
    });
    const style = getComputedStyle(root);
    const engine: GlassEngine = active ? "lens" : "frost";
    if (root.getAttribute("data-glass-engine") !== engine) {
      root.setAttribute("data-glass-engine", engine);
    }
    configureLens({
      active,
      depth: numberVar(style, "--glass-depth", DEFAULT_GLASS_TUNING.depth),
      splay: numberVar(style, "--glass-splay", DEFAULT_GLASS_TUNING.splay),
      feather: numberVar(
        style,
        "--glass-feather",
        DEFAULT_GLASS_TUNING.feather,
      ),
      curve: numberVar(style, "--glass-curve", DEFAULT_GLASS_TUNING.curve),
      chroma: numberVar(style, "--glass-chroma", DEFAULT_GLASS_TUNING.chroma),
      tint: numberVar(style, "--glass-tint", DEFAULT_GLASS_TUNING.tint),
      tintColor: colorVar(
        style,
        "--glass-tint-c",
        DEFAULT_GLASS_TUNING.tintColor,
      ),
    });
  };

  let evalFrame = 0;
  const queueEvaluate = () => {
    if (!evalFrame) {
      evalFrame = requestAnimationFrame(() => {
        evalFrame = 0;
        evaluate();
      });
    }
  };

  // Surfaces are not scanned here: they may be server HTML that is not hydrated
  // yet (also when streamed in later), so each registers itself from its own
  // effect. This observer picks up the popups React portals in afterwards.
  evaluate();

  const rootObserver = new MutationObserver(queueEvaluate);
  rootObserver.observe(root, {
    attributes: true,
    attributeFilter: ["style", "data-glass-level", "data-motion"],
  });

  const bodyObserver = new MutationObserver((records) => {
    for (const record of records) record.addedNodes.forEach(registerWithin);
    pruneGlass();
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });

  // The engine starts on idle, so a popup may already be open. Popups are
  // portaled after hydration, which makes them safe to register right away.
  document.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR).forEach(register);

  transparency.addEventListener("change", evaluate);
  contrast.addEventListener("change", evaluate);
  forced.addEventListener("change", evaluate);
  const stopPress = installPressGel();

  return () => {
    running = false;
    stopPress();
    transparency.removeEventListener("change", evaluate);
    contrast.removeEventListener("change", evaluate);
    forced.removeEventListener("change", evaluate);
    rootObserver.disconnect();
    bodyObserver.disconnect();
    cancelAnimationFrame(evalFrame);
    configureLens({ active: false });
    root.removeAttribute("data-glass-engine");
  };
}
