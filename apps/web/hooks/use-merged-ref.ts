"use client";

import { useCallback } from "react";
import type { Ref, RefCallback } from "react";

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

/**
 * One stable callback ref that forwards the node to every given ref. It only
 * changes identity when one of the refs does, so React does not detach and
 * re-attach it (null, then node) on every render.
 */
export function useMergedRef<T>(
  first: Ref<T> | undefined,
  second: Ref<T> | undefined,
  third?: Ref<T>,
): RefCallback<T> {
  return useCallback(
    (node: T | null) => {
      assignRef(first, node);
      assignRef(second, node);
      assignRef(third, node);
    },
    [first, second, third],
  );
}
