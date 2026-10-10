"use client";

import { useSyncExternalStore } from "react";

import {
  getGlassArtwork,
  getGlassPageArtwork,
  subscribeGlassArtwork,
} from "./glass-store";
import { PageWash } from "./page-wash";

const noArtwork = () => null;

/**
 * The colour field glass refracts: three gradient blobs, the playing artwork
 * blurred (`useGlassArtwork` publishes it) and, on a detail page, that page's
 * artwork as a wash fading down from the top (`useGlassPageArtwork`). Fixed
 * behind everything, so the sidebar, toolbar and player refract it too and
 * nothing clips it. Strength from `--ambient`, hidden by `data-ambient="off"`.
 * Mount once in the root layout; it reads no request data.
 */
export function GlassAmbient() {
  const artwork = useSyncExternalStore(
    subscribeGlassArtwork,
    getGlassArtwork,
    noArtwork,
  );
  const pageArtwork = useSyncExternalStore(
    subscribeGlassArtwork,
    getGlassPageArtwork,
    noArtwork,
  );
  return (
    <div data-glass-ambient aria-hidden="true">
      {/* A tiny copy scaled up: the blur costs a fraction of blurring it full size. */}
      {artwork ? <img alt="" src={artwork} decoding="async" /> : null}
      <PageWash url={pageArtwork} />
    </div>
  );
}
