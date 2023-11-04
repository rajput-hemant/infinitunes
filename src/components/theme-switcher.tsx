"use client";

import { useEffect } from "react";

import { useConfig } from "@/hooks/use-store";

export function ThemeSwitcher() {
  const [config] = useConfig();

  useEffect(() => {
    document.body.classList.forEach((className) => {
      if (className.match(/^theme.*/)) {
        document.body.classList.remove(className);
      }
    });

    document.body.style.setProperty("--radius", `${config.theme.radius}rem`);
    document.body.classList.add(`theme-${config.theme.name}`);
  }, [config]);

  return null;
}
