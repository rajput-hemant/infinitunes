import type { GlassSize } from "./lens-math";

/** What an overlay does, which decides whether it materializes. */
export type GlassRole =
  | "player"
  | "tabbar"
  | "toolbar"
  | "sidebar"
  | "queue"
  | "menu"
  | "dialog"
  | "sheet"
  | "palette"
  | "toast";

export const GLASS_ROLES: readonly GlassRole[] = [
  "player",
  "tabbar",
  "toolbar",
  "sidebar",
  "queue",
  "menu",
  "dialog",
  "sheet",
  "palette",
  "toast",
];

export function isGlassRole(value: string | undefined): value is GlassRole {
  return GLASS_ROLES.some((role) => role === value);
}

/** Roles whose lens ramps in with the CSS materialize animation. */
const MATERIALIZE_ROLES: ReadonlySet<GlassRole> = new Set([
  "menu",
  "dialog",
  "palette",
  "toast",
]);

export const materializes = (role: GlassRole | undefined): boolean =>
  role !== undefined && MATERIALIZE_ROLES.has(role);

export type OverlayTarget = {
  /** CSS selector of the popup element, as `packages/ui` renders it. */
  selector: string;
  role: GlassRole;
  size: GlassSize;
};

/**
 * Popups from `packages/ui` (read-only), identified by their real
 * `data-slot`. `styles/glass.css` styles the same list; a test keeps them in
 * step. Tooltips stay solid on purpose: they are tiny inverted labels.
 */
export const OVERLAY_TARGETS: readonly OverlayTarget[] = [
  { selector: '[data-slot="popover-content"]', role: "menu", size: "l" },
  { selector: '[data-slot="dropdown-menu-content"]', role: "menu", size: "l" },
  {
    selector: '[data-slot="dropdown-menu-sub-content"]',
    role: "menu",
    size: "l",
  },
  { selector: '[data-slot="dialog-content"]', role: "dialog", size: "l" },
  { selector: '[data-slot="alert-dialog-content"]', role: "dialog", size: "l" },
  { selector: '[data-slot="sheet-content"]', role: "sheet", size: "l" },
  { selector: '[data-slot="drawer-popup"]', role: "sheet", size: "l" },
  { selector: "[data-sonner-toast]", role: "toast", size: "m" },
];

/** Selector matching every overlay popup. */
export const OVERLAY_SELECTOR = OVERLAY_TARGETS.map((t) => t.selector).join(
  ",",
);

export function overlayTargetFor(el: Element): OverlayTarget | undefined {
  return OVERLAY_TARGETS.find((target) => el.matches(target.selector));
}
