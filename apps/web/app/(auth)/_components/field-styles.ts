import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

/** Mockup `.input`: a flat `--fill` field that lifts to the card colour on focus, not an outlined pill. */
export const authInputStyles = cn(
  controlStyles.textLg,
  controlStyles.flatInput,
);

/** Mockup `.btn.sq`: the square-cornered secondary action (GitHub, Google). */
export const authSquareButtonStyles = cn(
  controlStyles.text,
  controlStyles.squareButton,
);

/** Mockup `.btn.lg.sq.block`: the passkey action. */
export const authSquareLgButtonStyles = cn(
  controlStyles.textLg,
  controlStyles.squareButton,
);

/** Mockup `.btn.pri.lg.sq.block`. */
export const authPrimaryButtonStyles = cn(
  controlStyles.textLg,
  "w-full rounded-sm px-3 font-semibold",
);

export const authLabelStyles = "text-[0.8125rem] leading-5 font-semibold";

export const authLinkStyles =
  "font-semibold text-primary underline-offset-4 hover:underline";
