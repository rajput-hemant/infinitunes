"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@infinitunes/ui/components/toggle-group";
import { Monitor, Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

// Never changes after hydration; only the server/client snapshots differ.
const subscribeNever = () => () => {};

const segmentClassName = cn(
  controlStyles.headerIcon,
  "p-0 text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm aria-pressed:hover:bg-card dark:aria-pressed:bg-fill-2 dark:aria-pressed:hover:bg-fill-2",
);

type ThemeToggleGroupProps = {
  className?: string;
};

export function ThemeToggleGroup({ className }: ThemeToggleGroupProps) {
  const isMounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const { theme, setTheme } = useTheme();

  function handleThemeChange(value: string) {
    setTheme(value);
  }

  return (
    <ToggleGroup
      value={[isMounted ? (theme ?? "system") : "system"]}
      onValueChange={(v) => handleThemeChange(v[0])}
      className={cn("gap-0.5 rounded-ctl bg-fill p-0.5", className)}
    >
      <ToggleGroupItem
        aria-label="Toggle Light Mode"
        value="light"
        className={segmentClassName}
      >
        <SunMedium aria-hidden className="size-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        aria-label="Toggle System Mode"
        value="system"
        className={segmentClassName}
      >
        <Monitor aria-hidden className="size-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        aria-label="Toggle Dark Mode"
        value="dark"
        className={segmentClassName}
      >
        <Moon aria-hidden className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
