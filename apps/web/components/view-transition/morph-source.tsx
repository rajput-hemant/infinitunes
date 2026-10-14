"use client";

import { useEffect } from "react";

import { MORPH_CLASS, morphName } from "~/lib/view-transition";

/**
 * Names the artwork of the card a visitor opens, just before the navigation
 * starts. Names have to be unique on a page and the same album can sit in
 * several shelves, so only the clicked card ever holds one.
 */
export function MorphSource() {
  useEffect(() => {
    let named: HTMLElement | null = null;
    let observer: MutationObserver | null = null;
    let giveUp = 0;

    // The page opens on its loading skeleton; its artwork box takes the name
    // in the same DOM update, so the card still has something to fly into.
    const adopt = (name: string) => {
      observer?.disconnect();
      window.clearTimeout(giveUp);
      observer = new MutationObserver(() => {
        const target = document.querySelector<HTMLElement>(
          "[data-morph-target]",
        );
        if (!target) return;
        target.style.viewTransitionName = name;
        target.style.viewTransitionClass = MORPH_CLASS;
        observer?.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      giveUp = window.setTimeout(() => observer?.disconnect(), 8000);
    };

    const onClick = (event: MouseEvent) => {
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
      const art = card?.querySelector<HTMLElement>("[data-morph-art]");
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

      if (named) {
        named.style.viewTransitionName = "";
        named.style.viewTransitionClass = "";
      }
      const name = morphName(type, decodeURIComponent(token));
      art.style.viewTransitionName = name;
      art.style.viewTransitionClass = MORPH_CLASS;
      named = art;
      adopt(name);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      observer?.disconnect();
      window.clearTimeout(giveUp);
    };
  }, []);

  return null;
}
