"use client";

import { useEffect, useState } from "react";

import { useKeydown } from "~/hooks/use-keydown";

const OPTION_SELECTOR = "[data-search-option]";

function getOptions(listboxId: string) {
  const listbox = document.getElementById(listboxId);
  return listbox
    ? [...listbox.querySelectorAll<HTMLElement>(OPTION_SELECTOR)]
    : [];
}

type SearchPaletteKeysOptions = {
  enabled: boolean;
  listboxId: string;
  /** Selection returns to the first option whenever this changes. */
  resetKey: string;
};

/**
 * Keyboard selection for a combobox whose options are rendered elsewhere
 * (partly by Server Components). Options are found in the DOM, given ids and
 * `aria-selected`; the id of the selected one is returned for `aria-activedescendant`.
 */
export function useSearchPaletteKeys(options: SearchPaletteKeysOptions) {
  const { enabled, listboxId, resetKey } = options;

  const [index, setIndex] = useState(0);

  const scope = `${enabled}:${resetKey}`;
  const [seenScope, setSeenScope] = useState(scope);
  if (seenScope !== scope) {
    setSeenScope(scope);
    setIndex(0);
  }

  // Options mount after this hook (portal, results, streamed server rows), so the DOM is watched.
  useEffect(() => {
    if (!enabled) return;
    const sync = () => {
      const rows = getOptions(listboxId);
      const selected = Math.min(index, rows.length - 1);
      rows.forEach((row, i) => {
        row.id = `${listboxId}-option-${i}`;
        row.setAttribute("aria-selected", String(i === selected));
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled, listboxId, index]);

  useKeydown((event) => {
    const input = event.target;
    if (
      !enabled ||
      event.isComposing ||
      !(input instanceof HTMLInputElement) ||
      input.getAttribute("aria-controls") !== listboxId
    ) {
      return;
    }

    const rows = getOptions(listboxId);
    if (!rows.length) return;
    const selected = Math.min(index, rows.length - 1);

    if (event.key === "Enter") {
      event.preventDefault();
      rows[selected]?.click();
      return;
    }

    const step =
      event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (selected + step + rows.length) % rows.length;
    setIndex(next);
    rows[next]?.scrollIntoView?.({ block: "nearest" });
  });

  return { activeOptionId: `${listboxId}-option-${index}` };
}
