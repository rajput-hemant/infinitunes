"use client";

import { cn } from "@infinitunes/ui/lib/utils";
import * as React from "react";

import { useGlassRegistration } from "~/hooks/use-glass-registration";
import { useMergedRef } from "~/hooks/use-merged-ref";
import type { GlassSize } from "~/lib/glass/lens-math";
import type { GlassRole } from "~/lib/glass/overlays";

export type GlassVariant = "regular" | "clear" | "tinted";

type RenderElement = React.ReactElement<
  React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>
>;

export type GlassSurfaceProps = React.HTMLAttributes<HTMLElement> & {
  variant?: GlassVariant;
  size?: GlassSize;
  /** `"off"` opts out of refraction. `size="xl"` never refracts. */
  lens?: "on" | "off";
  /** The surface is itself a pressable control: it gets the press gel. */
  interactive?: boolean;
  /** What the surface is (`data-glass-role`); drives materialize and the tab bar / player rules. */
  glassRole?: GlassRole;
  /**
   * Render as another element, Base UI style: `render={<nav />}`. This
   * component's props win over the element's own; class names are merged.
   */
  render?: RenderElement;
};

/**
 * A navigation-layer glass surface. It only sets attributes; `GlassRuntime`
 * (mounted in the root layout) finds it and attaches the lens, pointer light
 * and press gel, and `styles/glass.css` paints it.
 */
export const GlassSurface = React.forwardRef<HTMLElement, GlassSurfaceProps>(
  function GlassSurface(
    {
      className,
      variant = "regular",
      size = "m",
      lens = "on",
      interactive = false,
      glassRole,
      render,
      children,
      ...props
    },
    forwardedRef,
  ) {
    const hostRef = React.useRef<HTMLElement | null>(null);
    const ref = useMergedRef<HTMLElement>(
      forwardedRef,
      render?.props.ref,
      hostRef,
    );
    useGlassRegistration(hostRef, variant, size, lens, glassRole);
    const merged = {
      ...(render?.props ?? {}),
      ...props,
      className: cn(render?.props.className, className),
      "data-glass": variant,
      "data-glass-size": size,
      "data-lens": lens === "off" || size === "xl" ? "off" : "on",
      "data-glass-role": glassRole,
      "data-glass-press": interactive ? "true" : undefined,
      ref,
    };

    if (render) {
      return React.cloneElement(
        render,
        merged,
        children ?? render.props.children,
      );
    }
    return <div {...merged}>{children}</div>;
  },
);
