"use client";

import { useEffect } from "react";

import { setGlassPageArtwork } from "~/components/glass/glass-store";

/**
 * Publishes a page's artwork to the ambient field while the page is mounted,
 * so its colour washes the whole viewport behind the sidebar and toolbar
 * instead of being clipped to the content column. The playing track's artwork
 * is a separate slot and keeps showing. Cleared on unmount; the effect runs in
 * the browser only, so the static shell stays free of request data.
 */
export function useGlassPageArtwork(url: string | null | undefined) {
  useEffect(() => {
    if (!url) return;
    setGlassPageArtwork(url);
    return () => setGlassPageArtwork(null);
  }, [url]);
}
