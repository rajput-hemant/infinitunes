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

/**
 * Icon-only controls are always square, one radius (`--r-ctl`), and the glyph
 * size follows the box: 16px in the 32px and 36px controls, 20px in the 40px
 * mini play, 24px in the 56px expanded play. The `[&_svg]` form outranks a
 * glyph's own `size-*` class, so a stray `size-5` on an icon cannot drift.
 */
export const ICON_CONTROL_SIZES = Object.freeze([32, 36, 40, 56] as const);

export const controlStyles = Object.freeze({
  // Text actions: buttons, selects, segmented items. 32px, 40px coarse.
  text: "h-(--ctl) rounded-(--r-ctl) px-3.5",
  // Prominent text actions: form submit, dialog confirm, Retry. 36px, 44px coarse.
  textLg: "h-(--ctl-lg) rounded-(--r-ctl) px-4.5",
  // Header and toolbar icon triggers. 32px, 40px coarse, 44px hit area.
  headerIcon: `size-(--ctl) shrink-0 rounded-(--r-ctl) [&_svg]:size-4 ${iconHitArea}`,
  // Icon buttons inside list rows. Same size as `headerIcon`.
  rowIcon: `size-(--ctl) shrink-0 rounded-(--r-ctl) [&_svg]:size-4 ${iconHitArea}`,
  // Hero Play CTA and its text companions. 36px, 44px coarse.
  hero: "h-(--ctl-lg) rounded-(--r-ctl) px-5",
  // Hero icon-only companions. 36px, 44px coarse.
  heroIcon: "size-(--ctl-lg) shrink-0 rounded-(--r-ctl) [&_svg]:size-4",
  // Play button over card artwork. 36px, 40px coarse (the card is narrow), 44px hit area.
  cardPlay: `size-(--ctl-lg) shrink-0 rounded-(--r-ctl) [&_svg]:size-4 pointer-coarse:size-(--ctl) ${iconHitArea}`,
  // Player transport controls (previous, next, shuffle, repeat). 32px, 40px coarse, 44px hit area.
  transport: `size-(--ctl) shrink-0 rounded-(--r-ctl) [&_svg]:size-4 ${iconHitArea}`,
  // Mini player Play. 40px, 44px hit area on coarse pointers.
  transportPlayMini: `size-10 shrink-0 rounded-(--r-ctl) [&_svg]:size-5 ${iconHitArea}`,
  // Expanded player Play. 56px.
  transportPlay: "size-14 shrink-0 rounded-(--r-ctl) [&_svg]:size-6",
  // Mockup `.input` surface: flat fill that lifts to the card colour on focus.
  // Compose with a size role (`textLg`), which supplies the height.
  flatInput:
    "w-full rounded-sm border-0 bg-fill px-3 shadow-none hover:bg-fill-2 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary dark:bg-fill dark:hover:bg-fill-2 dark:focus-visible:bg-card",
  // Mockup `.btn.sq` surface: square-cornered secondary action. Compose with a size role.
  squareButton:
    "rounded-sm border-0 bg-fill px-3 font-semibold hover:bg-fill-2 active:bg-fill-3 dark:bg-fill dark:hover:bg-fill-2",
});
