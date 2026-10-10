"use client";

import { cn } from "@infinitunes/ui/lib/utils";
import * as React from "react";

import { useGlassLens } from "./use-glass-lens";

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "regular" | "clear" | "tinted";
  size?: "s" | "m" | "l" | "xl";
  lens?: "on" | "off";
  interactive?: boolean;
}

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  (
    {
      className,
      variant = "regular",
      size = "m",
      lens = "on",
      interactive,
      children,
      ...props
    },
    forwardedRef,
  ) => {
    const internalRef = React.useRef<HTMLDivElement>(null);
    const ref = (forwardedRef as any) || internalRef;

    useGlassLens(internalRef, { size, off: lens === "off" });

    // Press gel interaction could be implemented via framer-motion or simple pointer events.
    // Spec mentions: "interactive press gel and pointer-driven rim angle"
    // I will add pointer handlers to set --g-px, --g-py, and --g-press.
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--g-px", `${px}%`);
      el.style.setProperty("--g-py", `${py}%`);
      el.style.setProperty("--g-press", "1");

      const up = () => {
        el.style.setProperty("--g-press", "0");
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
      props.onPointerDown?.(e);
    };

    return (
      <div
        ref={(node) => {
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
          (internalRef as any).current = node;
        }}
        data-glass={variant}
        data-glass-size={size}
        data-lens={lens}
        className={cn(className)}
        onPointerDown={interactive ? handlePointerDown : props.onPointerDown}
        {...props}
      >
        {children}
      </div>
    );
  },
);
GlassSurface.displayName = "GlassSurface";
