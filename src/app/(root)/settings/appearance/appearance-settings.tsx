"use client";

import { CheckIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { H3 } from "@/components/ui/topography";
import { themes } from "@/config/themes";
import { useConfig } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

export function AppearanceSettings() {
  const [{ theme }, setConfig] = useConfig();
  const { theme: themeMode, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      {/* light/dark mode */}
      <H3 id="mode">Theme Mode</H3>
      <div className="flex gap-4">
        {["light", "dark"].map((mode) => (
          <div key={mode} onClick={() => setTheme(mode)}>
            <div
              className={cn(
                "cursor-pointer items-center rounded-md border bg-background p-2 hover:bg-accent hover:text-foreground",
                mode === themeMode && "border-2 border-primary"
              )}
            >
              <div
                className={cn(mode, "space-y-2 rounded-sm bg-background p-2")}
              >
                <div className="space-y-2 rounded-md bg-muted p-2 shadow-sm">
                  <div className="h-2 w-[80px] rounded-lg bg-muted-foreground/25" />
                  <div className="h-2 w-[100px] rounded-lg bg-muted-foreground/25" />
                </div>

                <div className="flex items-center space-x-2 rounded-md bg-muted p-2 shadow-sm">
                  <div className="size-4 rounded-full bg-muted-foreground/25" />
                  <div className="h-2 w-[100px] rounded-lg bg-muted-foreground/25" />
                </div>

                <div className="flex items-center space-x-2 rounded-md bg-muted p-2 shadow-sm">
                  <div className="size-4 rounded-full bg-muted-foreground/25" />
                  <div className="h-2 w-[100px] rounded-lg bg-muted-foreground/25" />
                </div>
              </div>
            </div>

            <span className="block w-full p-2 text-center text-sm font-normal capitalize text-muted-foreground">
              {mode}
            </span>
          </div>
        ))}
      </div>

      {/* themes colors */}
      <H3 id="themes">Themes</H3>
      <div className="flex max-w-5xl flex-wrap gap-2">
        {themes.map((value) => (
          <Button
            size="sm"
            variant="outline"
            key={value.name}
            onClick={() => {
              setConfig((prev) => ({
                ...prev,
                theme: {
                  ...prev.theme,
                  name: value.name,
                },
              }));
            }}
            className={cn(
              "w-24 justify-start",
              theme.name === value.name && "border-2 border-primary"
            )}
            style={
              {
                "--theme-primary": `hsl(${
                  value?.activeColor[themeMode === "dark" ? "dark" : "light"]
                })`,
              } as React.CSSProperties
            }
          >
            <span
              className={cn(
                "mr-1 flex size-5 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-[--theme-primary]"
              )}
            >
              {theme.name === value.name && (
                <CheckIcon className="size-4 text-white" />
              )}
            </span>
            {value.label}
          </Button>
        ))}
      </div>

      {/* radius for elements */}
      <H3 id="radius">Radius</H3>
      <div className="flex flex-wrap gap-2">
        {["default", "0", "0.3", "0.5", "0.75", "1.0"].map((value) => (
          <Button
            size="sm"
            variant="outline"
            key={value}
            onClick={() => {
              setConfig((prev) => ({
                ...prev,
                theme: {
                  ...prev.theme,
                  radius: value === "default" ? "default" : parseFloat(value),
                },
              }));
            }}
            className={cn(
              "w-24 capitalize",
              (theme.radius === parseFloat(value) ||
                (value === "default" && theme.radius === "default")) &&
                "border-2 border-primary"
            )}
          >
            {value}
          </Button>
        ))}
      </div>
    </div>
  );
}
