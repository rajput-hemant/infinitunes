"use client";

import type { ReactNode } from "react";

import { useScrollEdge } from "~/hooks/use-scroll-edge";

type ToolbarProps = {
  children: ReactNode;
};

/**
 * The sticky toolbar. It has no background or divider: its glass capsules float
 * on the page, and the scroll edge fades content under them.
 */
export function Toolbar({ children }: ToolbarProps) {
  const ref = useScrollEdge<HTMLElement>();

  return (
    <header
      ref={ref}
      data-glass-edge="top"
      className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] w-full items-center gap-1 px-2 pt-[env(safe-area-inset-top)] md:h-14 md:gap-2 md:px-[max(var(--page-pad),calc((100%-100rem)/2))] md:pt-0"
    >
      {children}
    </header>
  );
}
