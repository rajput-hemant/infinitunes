/**
 * Shared control size contract. Apply these classes to buttons in app code;
 * `packages/ui` shadcn components stay untouched.
 *
 * Sizes read `--ctl` and `--ctl-lg` (`styles/globals.css`), which grow on
 * coarse pointers, so no class needs a `pointer-coarse:` height of its own:
 *
 * | role               | fine pointer | coarse pointer |
 * | ------------------ | ------------ | -------------- |
 * | `--ctl` controls   | 32px         | 40px           |
 * | `--ctl-lg` controls| 36px         | 44px           |
 *
 * Icon-only controls also grow an invisible hit area to 44px on coarse
 * pointers. The variable form (`h-(--ctl)`) is deliberate: `cn()` resolves
 * conflicts only for classes it recognizes, so it drops a component's own
 * `h-9` for `h-(--ctl)` but would keep both next to a named `h-ctl`.
 */
const iconHitArea =
  "relative pointer-coarse:after:absolute pointer-coarse:after:-inset-0.5";

export const controlStyles = Object.freeze({
  // Text actions: buttons, selects, segmented items. 32px, 40px coarse.
  text: "h-(--ctl) rounded-(--r-ctl) px-3.5",
  // Prominent text actions: form submit, dialog confirm, Retry. 36px, 44px coarse.
  textLg: "h-(--ctl-lg) rounded-(--r-ctl) px-4.5",
  // Header and toolbar icon triggers. 32px, 40px coarse, 44px hit area.
  headerIcon: `size-(--ctl) rounded-(--r-ctl) ${iconHitArea}`,
  // Icon buttons inside list rows. Same size as `headerIcon`.
  rowIcon: `size-(--ctl) rounded-(--r-ctl) ${iconHitArea}`,
  // Hero Play CTA and its text companions. 36px, 44px coarse.
  hero: "h-(--ctl-lg) rounded-(--r-ctl) px-5",
  // Hero icon-only companions. 36px, 44px coarse.
  heroIcon: "size-(--ctl-lg) rounded-(--r-ctl)",
  // Player transport controls (previous, next, shuffle, repeat). 32px, 40px coarse, 44px hit area.
  transport: `size-(--ctl) rounded-(--r-ctl) ${iconHitArea}`,
  // Mini player Play. 40px, 44px hit area on coarse pointers.
  transportPlayMini: `size-10 rounded-(--r-ctl) ${iconHitArea}`,
  // Expanded player Play. 56px.
  transportPlay: "size-14 rounded-(--r-ctl)",
});
