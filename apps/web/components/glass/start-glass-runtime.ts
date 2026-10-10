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

import { sampleBehind } from "./artwork-sampler";
import type { GlassTarget } from "./lens-registry";
import { configureLens, pruneGlass, registerGlass } from "./lens-registry";
import { installPointerLight } from "./pointer-light";
import { installPressGel } from "./press-gel";

const SURFACE_SELECTOR = "[data-glass][data-glass-size]";
const GLASS_SELECTOR = `${SURFACE_SELECTOR}, ${OVERLAY_SELECTOR}`;
const DEFAULT_REFRACTION = 30;
const DEFAULT_SPEC = 1;

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
  return { size, role };
}

function register(el: HTMLElement) {
  const target = targetFor(el);
  if (!target) return;
  registerGlass(el, target);
  if (el.dataset.glass === "clear") sampleBehind(el);
}

function registerWithin(node: Node) {
  if (!(node instanceof HTMLElement)) return;
  if (node.matches(GLASS_SELECTOR)) register(node);
  node.querySelectorAll<HTMLElement>(GLASS_SELECTOR).forEach(register);
}

/**
 * Starts the glass engine for the document: capability detection (sets
 * `html[data-glass-engine]`), surface discovery for every `data-glass` surface
 * and `packages/ui` popup, the lens lifecycle, pointer light and press gel.
 * One instance per page; returns the teardown.
 */
export function startGlassRuntime(): () => void {
  const root = document.documentElement;
  const capable = lensCapable();
  const transparency = window.matchMedia(
    "(prefers-reduced-transparency: reduce)",
  );
  const contrast = window.matchMedia("(prefers-contrast: more)");

  const evaluate = () => {
    const active = lensActive({
      capable,
      level: levelOf(root),
      reducedTransparency: transparency.matches,
      highContrast: contrast.matches,
    });
    const style = getComputedStyle(root);
    const engine: GlassEngine = active ? "lens" : "frost";
    if (root.getAttribute("data-glass-engine") !== engine) {
      root.setAttribute("data-glass-engine", engine);
    }
    configureLens({
      active,
      refraction: numberVar(style, "--glass-refraction", DEFAULT_REFRACTION),
      spec: numberVar(style, "--glass-spec", DEFAULT_SPEC),
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

  evaluate();
  document.querySelectorAll<HTMLElement>(GLASS_SELECTOR).forEach(register);

  const rootObserver = new MutationObserver(queueEvaluate);
  rootObserver.observe(root, {
    attributes: true,
    attributeFilter: [
      "style",
      "data-glass-level",
      "data-glass-variant",
      "data-motion",
    ],
  });

  const bodyObserver = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") {
        if (
          record.target instanceof HTMLElement &&
          record.target.matches(GLASS_SELECTOR)
        ) {
          register(record.target);
        }
        continue;
      }
      record.addedNodes.forEach(registerWithin);
    }
    pruneGlass();
  });
  bodyObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "data-glass",
      "data-glass-size",
      "data-glass-role",
      "data-lens",
    ],
  });

  transparency.addEventListener("change", evaluate);
  contrast.addEventListener("change", evaluate);
  const stopLight = installPointerLight();
  const stopPress = installPressGel();

  return () => {
    stopLight();
    stopPress();
    transparency.removeEventListener("change", evaluate);
    contrast.removeEventListener("change", evaluate);
    rootObserver.disconnect();
    bodyObserver.disconnect();
    cancelAnimationFrame(evalFrame);
    configureLens({ active: false });
    root.removeAttribute("data-glass-engine");
  };
}
