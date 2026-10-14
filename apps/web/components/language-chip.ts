import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

const chipBase = cn(
  controlStyles.text,
  "inline-flex shrink-0 items-center gap-2 px-3 text-[0.8125rem] leading-5 font-medium transition-[background-color,transform] duration-fast active:scale-96",
);

export function chipClass(selected: boolean) {
  return selected
    ? cn(chipBase, "bg-foreground text-background")
    : cn(chipBase, "bg-fill hover:bg-fill-2");
}
