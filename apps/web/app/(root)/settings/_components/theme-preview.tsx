import { buttonVariants } from "@infinitunes/ui/components/button";
import { Play } from "lucide-react";

import { GlassSurface } from "~/components/glass/glass-surface";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { GlassBackdrop } from "./glass-backdrop";

/** The Appearance page's live preview: sample content on glass over the colour field. */
export function ThemePreview() {
  return (
    <aside
      aria-label="Live preview"
      className="relative isolate grid min-h-60 content-end gap-3 overflow-hidden rounded-lg p-5 min-[90rem]:sticky min-[90rem]:top-20"
    >
      <GlassBackdrop />

      <GlassSurface
        size="m"
        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md p-3"
      >
        <div className="size-art rounded-sm bg-primary/30" />
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

      <GlassSurface size="m" className="grid gap-3 rounded-md p-3">
        <h3 className="font-heading text-lg">Heading preview</h3>
        <p className="text-muted-foreground">Body text at the current size.</p>
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
              "inline-flex items-center bg-primary/10 font-medium text-foreground inset-ring-2 inset-ring-primary",
            )}
          >
            Chip
          </span>
        </div>
      </GlassSurface>
    </aside>
  );
}
