"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useKeydown } from "~/hooks/use-keydown";

import { searchUi } from "./search-ui";

const ROW_SELECTOR = "[data-search-palette-row]";

export function useSearchPaletteKeys(enabled: boolean, listboxId: string) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const selectedRef = useRef(selectedIndex);
  selectedRef.current = selectedIndex;

  useEffect(() => {
    if (!enabled) setSelectedIndex(-1);
  }, [enabled]);

  useKeydown((e: KeyboardEvent) => {
    if (!enabled) return;
    const listbox = document.getElementById(listboxId);
    if (!listbox) return;

    const rows = [...listbox.querySelectorAll<HTMLElement>(ROW_SELECTOR)];
    if (!rows.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1 >= rows.length ? 0 : i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i <= 0 ? rows.length - 1 : i - 1));
      return;
    }
    if (e.key === "Enter" && selectedRef.current >= 0) {
      e.preventDefault();
      rows[selectedRef.current]?.click();
    }
  });

  useEffect(() => {
    if (!enabled) return;
    const listbox = document.getElementById(listboxId);
    if (!listbox) return;

    const rows = listbox.querySelectorAll<HTMLElement>(ROW_SELECTOR);
    rows.forEach((row, index) => {
      const selected = index === selectedIndex;
      row.setAttribute("aria-selected", selected ? "true" : "false");
      row.classList.toggle(searchUi.paletteRowSelected, selected);
    });
  }, [enabled, listboxId, selectedIndex]);

  const resetSelection = useCallback(() => setSelectedIndex(-1), []);

  return { selectedIndex, resetSelection };
}
