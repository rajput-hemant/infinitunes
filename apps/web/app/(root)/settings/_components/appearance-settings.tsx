"use client";

import type { ThemeConfig } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { setCookie } from "cookies-next";
import { CheckIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { themes } from "~/config/themes";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

const RADIUS = ["default", 0, 0.3, 0.5, 0.75, 1.0] as const;

export function AppearanceSettings({ theme, radius }: ThemeConfig) {
  const router = useRouter();

  const { resolvedTheme: themeMode, setTheme } = useTheme();

  function themeConfigHandler(config: ThemeConfig) {
    setCookie("theme-config", JSON.stringify(config), {
      path: "/",
    });
    router.refresh();
  }

  return (
    <div className="space-y-8 px-6">
      <section id="mode" className="space-y-4">
        <h2 className="font-heading text-lg dark:drop-shadow-md text-foreground sm:text-xl md:text-2xl">
          Theme Mode
        </h2>

        <div className="flex gap-4">
          {["light", "dark"].map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={mode === themeMode}
              onClick={() => setTheme(mode)}
              className="group rounded-md text-left outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div
                className={cn(
                  "items-center rounded-md border bg-background p-2 group-hover:bg-accent group-hover:text-foreground",
                  mode === themeMode && "border-primary ring-1 ring-primary",
                )}
              >
                <div
                  className={cn(mode, "space-y-2 rounded-sm bg-background p-2")}
                >
                  <div className="space-y-2 rounded-md bg-muted p-2 shadow-xs">
                    <div className="h-2 w-[80px] rounded-lg bg-muted-foreground/25" />
                    <div className="h-2 w-[100px] rounded-lg bg-muted-foreground/25" />
                  </div>

                  <div className="flex items-center space-x-2 rounded-md bg-muted p-2 shadow-xs">
                    <div className="size-4 rounded-full bg-muted-foreground/25" />
                    <div className="h-2 w-[100px] rounded-lg bg-muted-foreground/25" />
                  </div>

                  <div className="flex items-center space-x-2 rounded-md bg-muted p-2 shadow-xs">
                    <div className="size-4 rounded-full bg-muted-foreground/25" />
                    <div className="h-2 w-[100px] rounded-lg bg-muted-foreground/25" />
                  </div>
                </div>
              </div>

              <span className="block w-full p-2 text-center text-sm font-normal capitalize text-muted-foreground">
                {mode}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section id="themes" className="space-y-4">
        <h2 className="font-heading text-lg dark:drop-shadow-md text-foreground sm:text-xl md:text-2xl">
          Themes
        </h2>

        <div className="flex max-w-5xl flex-wrap gap-2">
          {themes.map(({ name, label }) => (
            <Button
              key={name}
              variant="outline"
              aria-pressed={name === theme}
              onClick={() => themeConfigHandler({ theme: name, radius })}
              className={cn(
                controlStyles.text,
                "w-28 justify-start",
                name === theme && "border-primary ring-1 ring-primary",
              )}
            >
              <span
                className={cn(
                  `theme-${name}`,
                  "flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground",
                )}
              >
                {theme === name && (
                  <CheckIcon aria-hidden className="size-3.5" />
                )}
              </span>
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section id="radius" className="space-y-4">
        <h2 className="font-heading text-lg dark:drop-shadow-md text-foreground sm:text-xl md:text-2xl">
          Radius
        </h2>

        <div className="flex flex-wrap gap-2">
          {RADIUS.map((value) => (
            <Button
              variant="outline"
              key={value}
              aria-pressed={radius === value}
              onClick={() => themeConfigHandler({ theme, radius: value })}
              className={cn(
                controlStyles.text,
                "w-24 capitalize",
                radius === value && "border-primary ring-1 ring-primary",
              )}
              style={
                value === "default"
                  ? {}
                  : ({
                      "--radius": `${value}rem`,
                    } as React.CSSProperties)
              }
            >
              {value}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
