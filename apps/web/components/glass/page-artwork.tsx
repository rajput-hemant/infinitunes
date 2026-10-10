"use client";

import { useGlassPageArtwork } from "~/hooks/use-glass-page-artwork";

/** Renders nothing; paints `src` into the ambient field while mounted. */
export function PageArtwork({ src }: { src: string }) {
  useGlassPageArtwork(src);
  return null;
}
