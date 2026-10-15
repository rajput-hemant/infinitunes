import { buttonVariants } from "@infinitunes/ui/components/button";
import { Play } from "lucide-react";

import { GlassSurface } from "~/components/glass/glass-surface";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { GlassBackdrop } from "./glass-backdrop";

/**
 * The live preview: sample content on glass over the stripe field. Beside the
 * controls on wide containers (sticky); a compact strip pinned under the
 * section rail on narrow ones, where only the now-playing sample stays.
 */
export function ThemePreview() {
  return (
    <aside
      aria-label="Live preview"
      className="sticky top-28 z-10 lg:top-16 @min-[60rem]/appearance:top-20 @min-[60rem]/appearance:z-0 @min-[60rem]/appearance:col-start-2 @min-[60rem]/appearance:row-start-1 @min-[60rem]/appearance:self-start"
    >
      <div className="relative isolate grid content-end gap-3 overflow-hidden rounded-lg border border-line p-3 @min-[60rem]/appearance:min-h-60 @min-[60rem]/appearance:p-5">
        <GlassBackdrop />

        <GlassSurface
          size="m"
          className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md p-2.5 @min-[60rem]/appearance:p-3"
        >
          <div className="size-art rounded-sm bg-primary/30 @max-[60rem]/appearance:size-9" />
          <div className="min-w-0">
            <p className="truncate font-semibold">Now playing</p>
            <p className="text-xs text-muted-foreground">Preview artist</p>
          </div>
          <span
            className={cn(
              controlStyles.heroIcon,
              "inline-flex items-center justify-center bg-primary text-primary-foreground",
            )}
          >
            <Play aria-hidden className="size-4 fill-current" />
          </span>
        </GlassSurface>

        <GlassSurface
          size="m"
          className="hidden gap-3 rounded-md p-3 @min-[60rem]/appearance:grid"
        >
          <h3 className="font-heading text-lg">Heading preview</h3>
          <p className="text-muted-foreground">
            Body text at the current size.
          </p>
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                buttonVariants({ variant: "default" }),
                controlStyles.text,
              )}
            >
              Primary
            </span>
            <span
              className={cn(
                buttonVariants({ variant: "outline" }),
                controlStyles.text,
              )}
            >
              Secondary
            </span>
            <span
              className={cn(
                controlStyles.text,
                "inline-flex items-center bg-primary/10 font-medium text-foreground inset-ring-1 inset-ring-primary",
              )}
            >
              Chip
            </span>
          </div>
        </GlassSurface>
      </div>
    </aside>
  );
}
