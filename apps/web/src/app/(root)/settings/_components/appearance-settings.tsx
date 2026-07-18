"use client";

import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";
import { CheckIcon } from "lucide-react";
import { useTheme } from "next-themes";

import type { ThemeConfig } from "@/types";

import { Button } from "@/components/ui/button";
import { themes } from "@/config/themes";
import { cn } from "@/lib/utils";

const RADIUS = ["default", 0, 0.3, 0.5, 0.75, 1.0] as const;

export function AppearanceSettings({ theme, radius }: ThemeConfig) {
  const router = useRouter();

  const { resolvedTheme: themeMode, setTheme } = useTheme();

  function themeConfigHandler({ theme, radius }: ThemeConfig) {
    setCookie("theme-config", JSON.stringify({ theme, radius }), {
      path: "/",
    });
    router.refresh();
  }

  return (
    <div className="space-y-8 px-6">
      <section id="mode" className="space-y-4">
        <h3 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
          Theme Mode
        </h3>

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
      </section>

      <section id="themes" className="space-y-4">
        <h3 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
          Themes
        </h3>

        <div className="flex max-w-5xl flex-wrap gap-2">
          {themes.map(({ name, activeColor, label }) => (
            <Button
              key={name}
              size="sm"
              variant="outline"
              onClick={() => themeConfigHandler({ theme: name, radius })}
              className={cn(
                "w-24 justify-start",
                name === theme && "border-2 border-primary"
              )}
              style={
                {
                  "--theme-primary": `hsl(${
                    activeColor[themeMode === "dark" ? "dark" : "light"]
                  })`,
                } as React.CSSProperties
              }
            >
              <span className="mr-1 flex size-5 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-[--theme-primary]">
                {theme === name && <CheckIcon className="size-4 text-white" />}
              </span>
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section id="radius" className="space-y-4">
        <h3 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
          Radius
        </h3>

        <div className="flex flex-wrap gap-2">
          {RADIUS.map((value) => (
            <Button
              size="sm"
              variant="outline"
              key={value}
              onClick={() => themeConfigHandler({ theme, radius: value })}
              className={cn(
                "w-24 capitalize",
                radius === value && "border-2 border-primary"
              )}
              style={
                value === "default" ?
                  {}
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
