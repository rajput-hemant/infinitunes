import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

/** The closed trigger's classes, shared by the shells and the real popups so the swap changes nothing. */
export function moreTriggerClassName(
  layout: "flex" | "inline-flex",
  className?: string,
) {
  return cn(
    controlStyles.rowIcon,
    layout,
    "items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );
}
