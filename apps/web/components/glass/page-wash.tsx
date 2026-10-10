"use client";

import { useState } from "react";

/**
 * A detail page's artwork wash in the ambient field. Navigating between two
 * detail pages used to drop the old wash at once and pop the new one in when
 * its image arrived, flashing the field empty. Here a new image loads hidden,
 * then fades in over the previous one, which stays until it has; the wash
 * fades out when the next page has none.
 */
export function PageWash({ url }: { url: string | null }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [shown, setShown] = useState<string | null>(null);
  const [seen, setSeen] = useState<string | null>(null);

  // Adjust during render, as `ImageWithFallback` does, so no frame paints stale.
  if (url !== seen) {
    setSeen(url);
    if (url === null) {
      setShown(null);
    } else if (urls.includes(url)) {
      setShown(url);
    } else {
      // Keep the latest earlier layer (on screen, or still fading out) and the
      // newcomer that is loading; anything older is long invisible.
      setUrls([...urls.slice(-1), url]);
    }
  }

  const drop = (gone: string) =>
    setUrls((current) => current.filter((known) => known !== gone));

  return urls.map((layer) => (
    <span
      key={layer}
      data-page-art-layer=""
      data-shown={layer === shown ? "" : undefined}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && layer !== shown) {
          drop(layer);
        }
      }}
    >
      <img
        data-page-art
        alt=""
        src={layer}
        decoding="async"
        onLoad={() => {
          if (layer === url) setShown(layer);
        }}
        onError={() => {
          drop(layer);
          if (layer === shown) setShown(null);
        }}
      />
    </span>
  ));
}
