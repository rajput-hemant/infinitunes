/**
 * Shared control size contract. Apply these classes to buttons in app code;
 * `packages/ui` shadcn components stay untouched.
 */
export const controlStyles = Object.freeze({
  // Text actions: forms, dialogs, Save, Retry (44px).
  text: "h-11 px-4",
  // Header and icon triggers (44px).
  headerIcon: "size-11",
  // Row icon buttons: 32px fine pointer, 44px touch.
  rowIcon: "size-8 pointer-coarse:size-11",
  // Hero Play CTA and companions.
  hero: "h-11 rounded-full px-6",
  // Hero icon-only companions.
  heroIcon: "size-11 rounded-full",
  // Player transport controls (44px).
  transport: "size-11",
  // Expanded player Play (56px).
  transportPlay: "size-14",
});
