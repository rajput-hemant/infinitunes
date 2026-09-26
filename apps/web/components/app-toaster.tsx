"use client";

import { Toaster as UiToaster } from "@infinitunes/ui/components/sonner";
import type { ToasterProps } from "sonner";

export function AppToaster(props: ToasterProps) {
  return (
    <UiToaster
      {...props}
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--border))",
          "--border-radius": "var(--radius)",
          ...props.style,
        } as React.CSSProperties
      }
    />
  );
}
