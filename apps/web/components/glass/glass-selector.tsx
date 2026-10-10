"use client";

import { cn } from "@infinitunes/ui/lib/utils";
import * as React from "react";

import { useGlassSelector } from "./use-glass-selector";

export type GlassSelectorProps = React.HTMLAttributes<HTMLElement> & {
  /** Commits a drag release on an item. Defaults to clicking it. */
  onPick?: (item: HTMLElement) => void;
  /** Render as another element, e.g. `render={<nav />}`. */
  render?: React.ReactElement<
    React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>
  >;
};

/**
 * A row of items with a sliding selection indicator that lifts into a
 * magnifying glass droplet while pressed or dragged: the phone tab bar and
 * segmented controls. Mark each child `data-glass-item` and the active one
 * with `aria-current`, `aria-selected` or `aria-pressed`. Put `data-glass` on
 * the host (the tab bar) or leave it a plain fill (a segmented control).
 */
export function GlassSelector({
  className,
  children,
  onPick,
  render,
  ...props
}: GlassSelectorProps) {
  const hostRef = React.useRef<HTMLElement | null>(null);
  useGlassSelector(hostRef, onPick);

  const merged = {
    ...(render?.props ?? {}),
    ...props,
    className: cn(render?.props.className, className),
    "data-glass-selector": "",
    ref: hostRef,
  };
  const content = (
    <>
      <span data-glass-indicator="" aria-hidden="true" />
      {children ?? render?.props.children}
    </>
  );
  return render
    ? React.cloneElement(render, merged, content)
    : React.createElement("div", merged, content);
}
