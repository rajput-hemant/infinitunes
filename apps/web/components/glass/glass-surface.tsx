"use client";

import { cn } from "@infinitunes/ui/lib/utils";
import * as React from "react";

import { useGlassRegistration } from "~/hooks/use-glass-registration";
import { useMergedRef } from "~/hooks/use-merged-ref";
import type { GlassSize } from "~/lib/glass/lens-math";
import type { GlassRole } from "~/lib/glass/overlays";
import { GLASS_PRESETS, glassPaintVars } from "~/lib/glass/tuning";
import type { GlassPresetId } from "~/lib/glass/tuning";

export type GlassVariant = "regular" | "clear" | "tinted";

type RenderElement = React.ReactElement<
  React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>
>;

export type GlassSurfaceProps = React.HTMLAttributes<HTMLElement> & {
  variant?: GlassVariant;
  size?: GlassSize;
  /** `"off"` opts out of refraction. `size="xl"` never refracts. */
  lens?: "on" | "off";
  /**
   * Tune this surface on its own with one of the lens presets, instead of the
   * page's glass settings (`data-glass-preset`).
   */
  preset?: GlassPresetId;
  /** The surface is itself a pressable control: it gets the press gel. */
  interactive?: boolean;
  /** What the surface is (`data-glass-role`); drives materialize and the tab bar / player rules. */
  glassRole?: GlassRole;
  /** The host element, forwarded to the rendered element. */
  ref?: React.Ref<HTMLElement>;
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
export function GlassSurface({
  className,
  variant = "regular",
  size = "m",
  lens = "on",
  preset,
  interactive = false,
  glassRole,
  render,
  children,
  ref: forwardedRef,
  ...props
}: GlassSurfaceProps) {
  const hostRef = React.useRef<HTMLElement | null>(null);
  const ref = useMergedRef<HTMLElement>(
    forwardedRef,
    render?.props.ref,
    hostRef,
  );
  useGlassRegistration(hostRef, variant, size, lens, glassRole, preset);
  const own = preset ? GLASS_PRESETS[preset].tuning : null;
  const merged = {
    ...(render?.props ?? {}),
    ...props,
    className: cn(render?.props.className, className),
    style: own
      ? {
          ...render?.props.style,
          ...props.style,
          ...glassPaintVars(own),
        }
      : (props.style ?? render?.props.style),
    "data-glass-preset": preset,
    "data-glass-tint": own && own.tint > 0 ? "on" : undefined,
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
}
