"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@infinitunes/ui/components/toggle-group";
import { Monitor, Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useCallback } from "react";

import { cn } from "~/lib/utils";

type ThemeToggleGroupProps = {
  className?: string;
};

export function ThemeToggleGroup({ className }: ThemeToggleGroupProps) {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isMounted = useCallback(() => isMountedRef.current, []);

  const { theme, setTheme } = useTheme();

  function handleThemeChange(value: string) {
    setTheme(value);
  }

  return (
    <ToggleGroup
      value={[isMounted() ? (theme ?? "system") : "system"]}
      onValueChange={(v) => handleThemeChange(v[0])}
      className={cn("rounded-full border p-1", className)}
    >
      <ToggleGroupItem
        aria-label="Toggle Light Mode"
        value="light"
        className="size-8 rounded-full px-2"
      >
        <SunMedium className="h-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        aria-label="Toggle System Mode"
        value="system"
        className="size-8 rounded-full px-2"
      >
        <Monitor className="h-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        aria-label="Toggle Dark Mode"
        value="dark"
        className="size-8 rounded-full px-2"
      >
        <Moon className="h-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
