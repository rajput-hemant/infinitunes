import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

/** Mockup `.input`: a flat `--fill` field that lifts to the card colour on focus, not an outlined pill. */
export const authInputStyles = cn(
  controlStyles.textLg,
  "w-full rounded-sm border-0 bg-fill px-3 shadow-none hover:bg-fill-2 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary dark:bg-fill dark:hover:bg-fill-2 dark:focus-visible:bg-card",
);

const squareButton =
  "w-full rounded-sm border-0 bg-fill px-3 font-semibold hover:bg-fill-2 active:bg-fill-3 dark:bg-fill dark:hover:bg-fill-2";

/** Mockup `.btn.sq`: the square-cornered secondary action (GitHub, Google). */
export const authSquareButtonStyles = cn(controlStyles.text, squareButton);

/** Mockup `.btn.lg.sq.block`: the passkey action. */
export const authSquareLgButtonStyles = cn(controlStyles.textLg, squareButton);

/** Mockup `.btn.pri.lg.sq.block`. */
export const authPrimaryButtonStyles = cn(
  controlStyles.textLg,
  "w-full rounded-sm px-3 font-semibold",
);

export const authLabelStyles = "text-[0.8125rem] leading-5 font-semibold";

export const authLinkStyles =
  "font-semibold text-primary underline-offset-4 hover:underline";
