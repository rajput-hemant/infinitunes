import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import type * as React from "react";

import { cn } from "~/lib/utils";

type BarButtonProps = React.ComponentProps<"button"> & { tooltip: string };

/**
 * An icon button on the glass player bar. Hover is the translucent glass fill
 * (`--muted` is remapped inside glass); the press is the glass runtime's gel,
 * so there is no flat `:active` shrink here.
 */
export function BarButton({ tooltip, className, ...props }: BarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-ctl transition-colors duration-fast hover:bg-muted",
              className,
            )}
            {...props}
          />
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
