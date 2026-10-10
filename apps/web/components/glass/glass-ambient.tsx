"use client";

import { useSyncExternalStore } from "react";

import { getGlassArtwork, subscribeGlassArtwork } from "./glass-store";

const noArtwork = () => null;

/**
 * The colour field glass refracts: three gradient blobs, plus the playing
 * artwork blurred (`useGlassArtwork` publishes it). Fixed behind everything,
 * strength from `--ambient`, hidden by `data-ambient="off"`. Mount once in the
 * root layout; it reads no request data.
 */
export function GlassAmbient() {
  const artwork = useSyncExternalStore(
    subscribeGlassArtwork,
    getGlassArtwork,
    noArtwork,
  );
  return (
    <div data-glass-ambient aria-hidden="true">
      {/* A tiny copy scaled up: the blur costs a fraction of blurring it full size. */}
      {artwork ? <img alt="" src={artwork} decoding="async" /> : null}
    </div>
  );
}
