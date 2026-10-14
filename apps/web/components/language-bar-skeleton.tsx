import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

const CHIP_WIDTHS = ["w-12", "w-20", "w-16", "w-20", "w-16", "w-24"] as const;
const CHIP_COUNT = 14;

/** Mirrors `LanguageBar`: a row of control-height chips in the same scroller. */
export function LanguageBarSkeleton() {
  return (
    <div className="mb-6 overflow-x-hidden p-0.5">
      <ul className="flex gap-2">
        {Array.from({ length: CHIP_COUNT }).map((_, i) => (
          <li key={i}>
            <Skeleton
              className={cn(
                controlStyles.text,
                "shrink-0",
                CHIP_WIDTHS[i % CHIP_WIDTHS.length],
              )}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
