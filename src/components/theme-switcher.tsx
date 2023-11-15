"use client";

import { useLayoutEffect } from "react";

import { useConfig } from "@/hooks/use-store";

export function ThemeSwitcher() {
  const [config] = useConfig();

  useLayoutEffect(() => {
    document.body.classList.forEach((className) => {
      if (className.match(/^theme.*/)) {
        document.body.classList.remove(className);
      }
    });

    document.body.classList.add(`theme-${config.theme.name}`);

    if (config.theme.radius === "default") {
      document.body.style.removeProperty("--radius");
    } else {
      document.body.style.setProperty("--radius", `${config.theme.radius}rem`);
    }
  }, [config]);

  return null;
}
