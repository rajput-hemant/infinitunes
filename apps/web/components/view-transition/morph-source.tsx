"use client";

import { useEffect } from "react";

import { morphName } from "~/lib/view-transition";

import { dropMorph, offerMorph } from "./morph-state";

/**
 * Names the artwork of the card a visitor opens, just before the navigation
 * starts. Names have to be unique on a page and the same album can sit in
 * several shelves, so only the clicked card ever holds one. `data-morph` marks
 * a card (its value is the media type), `data-morph-art` its artwork.
 */
export function MorphSource() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Any click ends the previous offer; a card click below makes a new one.
      dropMorph();
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const card = event.target.closest<HTMLElement>("[data-morph]");
      // The card itself may be the artwork (a tile that is one link).
      const art = card?.matches("[data-morph-art]")
        ? card
        : card?.querySelector<HTMLElement>("[data-morph-art]");
      const anchor = event.target.closest("a[href]");
      if (!card || !art || !anchor) return;

      const token = new URL(
        anchor.getAttribute("href") ?? "",
        location.href,
      ).pathname
        .split("/")
        .filter(Boolean)
        .pop();
      const type = card.dataset.morph;
      if (!token || !type) return;

      offerMorph(morphName(type, decodeURIComponent(token)), art);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      dropMorph();
    };
  }, []);

  return null;
}
