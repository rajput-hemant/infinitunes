"use client";

import { createContext, use } from "react";
import type { ReactNode } from "react";

import type { Viewer } from "~/lib/viewer-types";

const ViewerContext = createContext<Promise<Viewer> | null>(null);

type ViewerProviderProps = {
  /** Started, not awaited, by the layout; resolved behind `<Suspense>` below. */
  viewer: Promise<Viewer>;
  children: ReactNode;
};

/**
 * Carries the visitor (session, playlists, favorites) to the layout's client
 * islands as a promise. The layout never awaits it, so the chrome around the
 * islands prerenders and each island streams in behind its own fallback.
 */
export function ViewerProvider({ viewer, children }: ViewerProviderProps) {
  return <ViewerContext value={viewer}>{children}</ViewerContext>;
}

/** Suspends until the viewer resolves; call it under a `<Suspense>` boundary. */
export function useViewer(): Viewer {
  const viewer = use(ViewerContext);
  if (!viewer)
    throw new Error("useViewer must be used within a ViewerProvider");

  return use(viewer);
}
