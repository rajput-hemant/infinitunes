"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { TOOLBAR_TITLE_SLOT } from "~/components/site-header/toolbar-slots";

type ToolbarTitleProps = {
  title: string;
};

// The slot is part of the layout and does not move while a page is mounted.
function subscribeToNothing() {
  return () => {};
}

function findSlot() {
  return document.querySelector<HTMLElement>(TOOLBAR_TITLE_SLOT);
}

function noSlot() {
  return null;
}

/**
 * The page title in the toolbar, faded in by `data-glass-titled`. It is
 * `aria-hidden` because the heading is the one assistive tech announces.
 */
export function ToolbarTitle({ title }: ToolbarTitleProps) {
  const slot = useSyncExternalStore(subscribeToNothing, findSlot, noSlot);

  if (!slot) return null;

  return createPortal(
    <span
      aria-hidden="true"
      className="block truncate text-sm font-semibold opacity-0 translate-y-1 transition-[opacity,transform] duration-base ease-spring in-data-[glass-titled]:translate-y-0 in-data-[glass-titled]:opacity-100 motion-reduce:transition-none"
    >
      {title}
    </span>,
    slot,
  );
}
