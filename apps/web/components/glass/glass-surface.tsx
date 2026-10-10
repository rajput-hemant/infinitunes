"use client";

import { cn } from "@infinitunes/ui/lib/utils";
import * as React from "react";

import { useGlassLens } from "./use-glass-lens";

export type GlassSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "regular" | "clear" | "tinted";
  size?: "s" | "m" | "l" | "xl";
  lens?: "on" | "off";
  interactive?: boolean;
};

function assignRef<T>(ref: React.ForwardedRef<T>, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  function GlassSurface(
    {
      className,
      variant = "regular",
      size = "m",
      lens = "on",
      interactive = false,
      onPointerDown,
      children,
      ...props
    },
    forwardedRef,
  ) {
    const surfaceRef = React.useRef<HTMLDivElement | null>(null);

    useGlassLens(surfaceRef, { size, off: lens === "off" });

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event);
      if (!interactive) return;

      const surface = event.currentTarget;
      const rect = surface.getBoundingClientRect();
      surface.style.setProperty(
        "--g-px",
        `${((event.clientX - rect.left) / rect.width) * 100}%`,
      );
      surface.style.setProperty(
        "--g-py",
        `${((event.clientY - rect.top) / rect.height) * 100}%`,
      );
      surface.style.setProperty("--g-press", "1");

      const release = () => {
        surface.style.setProperty("--g-press", "0");
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
      };
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    };

    return (
      <div
        {...props}
        ref={(node) => {
          surfaceRef.current = node;
          assignRef(forwardedRef, node);
        }}
        data-glass={variant}
        data-glass-size={size}
        data-lens={lens}
        className={cn(className)}
        onPointerDown={handlePointerDown}
      >
        {children}
      </div>
    );
  },
);
