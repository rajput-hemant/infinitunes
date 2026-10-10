"use client";

import { useEffect } from "react";

import {
  applyArtworkTint,
  clearArtworkTint,
  sampleArtwork,
} from "~/components/glass/artwork-sampler";
import { setGlassArtwork } from "~/components/glass/glass-store";

function reset() {
  setGlassArtwork(null);
  clearArtworkTint();
}

/**
 * Feeds the playing artwork to the glass engine. The ambient field renders
 * it, and an 8x8 sample sets the adaptive tint (`--g-art-l`, `--g-art`,
 * `--g-blob-1..3` on `<html>`): bright artwork gets more tint, dark artwork
 * less in light mode, the reverse in dark. Pass `null` when nothing plays.
 * Call from one place only (the player); the latest caller wins.
 */
export function useGlassArtwork(url: string | null | undefined) {
  useEffect(() => {
    if (!url) {
      reset();
      return;
    }
    let current = true;
    setGlassArtwork(url);
    void sampleArtwork(url).then((sample) => {
      if (current && sample) applyArtworkTint(sample);
    });
    return () => {
      current = false;
    };
  }, [url]);

  useEffect(() => reset, []);
}
