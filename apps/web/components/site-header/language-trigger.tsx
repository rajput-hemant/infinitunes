import { ChevronDown, Languages } from "lucide-react";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

/** The closed trigger, shared by the toolbar shell and the real popup so the swap changes nothing. */
export const languageTriggerProps = {
  "aria-label": "Choose languages",
  variant: "ghost",
  className: cn(controlStyles.headerIcon, "gap-2 p-0 md:w-auto md:px-3"),
  "data-deferred": "languages",
} as const;

export function LanguageTriggerContent({ isOpen }: { isOpen: boolean }) {
  return (
    <>
      <Languages aria-hidden="true" className="aspect-square size-4" />
      <span className="hidden text-sm md:inline-block">Languages</span>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "hidden size-4 duration-base md:inline-block",
          isOpen && "rotate-180",
        )}
      />
    </>
  );
}
