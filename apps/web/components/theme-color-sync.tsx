"use client";

import React from "react";

/**
 * Keeps `<meta name="theme-color">` equal to the rendered `--background`.
 * The static tags follow the OS scheme only; this also follows the in-app
 * light/dark choice (`html` class), and re-applies after Next replaces the
 * head tags. Surfaces are shared by every accent, so nothing else moves it.
 */
export function ThemeColorSync() {
  React.useEffect(() => {
    const probe = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    });
    if (!probe) return;

    let frame = 0;

    function sync() {
      frame = 0;
      if (!probe) return;

      probe.fillStyle = getComputedStyle(document.body).backgroundColor;
      probe.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
      const color = `rgb(${r} ${g} ${b})`;

      document
        .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
        .forEach((meta) => {
          if (meta.content !== color) meta.content = color;
        });
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.head, { childList: true });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    schedule();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
