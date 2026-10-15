"use client";

import { Skeleton } from "@infinitunes/ui/components/skeleton";
import type { ReactNode } from "react";
import { useCallback } from "react";

import { MORPH_CLASS } from "~/lib/view-transition";

import { claimMorph } from "./morph-state";

/** How long a claimed name stays on the real artwork: past the longest morph. */
const NAME_HOLD_MS = 4000;

/**
 * A ref callback for artwork that a card can fly into. It runs as the element
 * mounts, in the commit the view transition animates. `hold` keeps the real
 * artwork from carrying the name into later transitions, where it would only
 * lift the artwork out of the page snapshot for nothing.
 */
function useMorphRef(expected: string | undefined, hold: boolean) {
  return useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;
      const name = claimMorph(expected);
      if (!name) return;
      node.style.viewTransitionName = name;
      node.style.viewTransitionClass = MORPH_CLASS;
      if (!hold) return;
      window.setTimeout(() => {
        node.style.viewTransitionName = "";
        node.style.viewTransitionClass = "";
      }, NAME_HOLD_MS);
    },
    [expected, hold],
  );
}

/**
 * The artwork placeholder of a detail page's loading skeleton. When the page
 * was opened from a card it takes the card's name, so the card flies into the
 * placeholder while the page loads, and the real artwork then takes the name
 * over in place.
 */
export function MorphSkeleton({ className }: { className?: string }) {
  return <Skeleton ref={useMorphRef(undefined, false)} className={className} />;
}

/** The real artwork of a detail page; `name` is the morph name it answers to. */
export function MorphArt({
  name,
  className,
  children,
}: {
  name: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div ref={useMorphRef(name, true)} className={className}>
      {children}
    </div>
  );
}
