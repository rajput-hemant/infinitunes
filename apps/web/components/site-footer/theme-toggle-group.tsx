"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@infinitunes/ui/components/toggle-group";
import { Monitor, Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { useIsHydrated } from "~/hooks/use-is-hydrated";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

const segmentClassName = cn(
  controlStyles.headerIcon,
  "p-0 text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm aria-pressed:hover:bg-card dark:aria-pressed:bg-fill-2 dark:aria-pressed:hover:bg-fill-2",
);

type ThemeToggleGroupProps = {
  className?: string;
  /** Segments share the row evenly, for use inside a menu or sheet. */
  stretch?: boolean;
};

export function ThemeToggleGroup({
  className,
  stretch = false,
}: ThemeToggleGroupProps) {
  const isMounted = useIsHydrated();

  const { theme, setTheme } = useTheme();

  // Base UI reports an empty selection when the pressed item is pressed again;
  // a theme is always selected, so that is not a change.
  function handleThemeChange(value: string[]) {
    const [next] = value;
    if (next) setTheme(next);
  }

  return (
    <ToggleGroup
      value={[isMounted ? (theme ?? "system") : "system"]}
      onValueChange={handleThemeChange}
      aria-label="Theme"
      className={cn(
        "gap-0.5 rounded-ctl bg-fill p-0.5",
        stretch && "flex w-full",
        className,
      )}
    >
      <ToggleGroupItem
        aria-label="Toggle Light Mode"
        value="light"
        className={cn(segmentClassName, stretch && "w-auto flex-1")}
      >
        <SunMedium aria-hidden className="size-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        aria-label="Toggle Dark Mode"
        value="dark"
        className={cn(segmentClassName, stretch && "w-auto flex-1")}
      >
        <Moon aria-hidden className="size-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        aria-label="Toggle System Mode"
        value="system"
        className={cn(segmentClassName, stretch && "w-auto flex-1")}
      >
        <Monitor aria-hidden className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
