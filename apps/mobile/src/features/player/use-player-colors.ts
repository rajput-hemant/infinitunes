import { getImageSrc } from "@infinitunes/types";
import type { ImageQuality } from "@infinitunes/types";
import {
  keepPreviousData,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Image } from "expo-image";
import { useEffect, useMemo } from "react";
import { Platform, useColorScheme } from "react-native";
import { getColors } from "react-native-image-colors";

import {
  loadMaterialColors,
  NO_SWATCH,
  playerColorsFromSeed,
  seedFromImageColors,
} from "~/lib/artwork-colors";
import type { PlayerColors } from "~/lib/artwork-colors";
import { usePlayer } from "~/playback/player-store";

/** One cache entry per artwork URL; a cover's colours never change. */
export function artworkColorsKey(src: string) {
  return ["artwork-colors", src] as const;
}

/**
 * How long one extraction may take. Android's extractor opens the URL with
 * no connect or read timeout, so a stalled download would never settle.
 */
export const EXTRACTION_TIMEOUT_MS = 8000;

/** Smallest first: any rendition gives the colour, a small one decodes faster. */
const RENDITIONS: readonly ImageQuality[] = ["low", "medium", "high"];

/**
 * A rendition of the artwork expo-image already holds on disk (the mini
 * player and Now Playing loaded it), as a `file://` URI, so the colour reads
 * offline and without a second download. `null` when none is cached.
 */
async function cachedRendition(image: string): Promise<string | null> {
  for (const quality of RENDITIONS) {
    const path = await Image.getCachePathAsync(
      getImageSrc(image, quality),
    ).catch(() => null);
    if (path) return path.startsWith("file://") ? path : `file://${path}`;
  }
  return null;
}

function withTimeout<T>(work: Promise<T>, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Timed out reading the colour of ${what}`)),
      EXTRACTION_TIMEOUT_MS,
    );
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/**
 * The artwork's seed colour, read natively from a cached rendition or else
 * the smallest one (the extractor downloads it itself). Throws when nothing
 * usable comes back in time, so the player falls back to the D1 palette and
 * a later mount tries again.
 */
async function fetchSeed(image: string, src: string): Promise<string> {
  // The colour library loads with the first extraction, off the launch path.
  await loadMaterialColors();
  const uri = (await cachedRendition(image)) ?? src;
  const result = await withTimeout(
    getColors(uri, { quality: "low", fallback: NO_SWATCH }),
    src,
  );
  const seed = seedFromImageColors(result);
  if (!seed) throw new Error(`No colour in ${src}`);
  return seed;
}

/** The query for one cover's seed colour, shared by the hook and the prefetch. */
function seedQuery(image: string) {
  const src = image ? getImageSrc(image, "low") : "";
  return queryOptions({
    queryKey: artworkColorsKey(src),
    queryFn: () => fetchSeed(image, src),
    enabled: src !== "",
    // A cached rendition reads offline; without one the fetch fails fast
    // rather than pausing, which would hold the previous cover's wash.
    networkMode: "always",
    staleTime: Infinity,
    // One short string per cover: keep it for the session, so a track that
    // comes round again (repeat, back) washes at once.
    gcTime: Infinity,
    retry: false,
  });
}

/**
 * Reads the next track's cover colour while the current one plays, so the
 * wash is ready when Next lands. Only in queue order: a shuffled queue's next
 * track is not known until it is picked.
 */
function usePrefetchNextSeed() {
  const client = useQueryClient();
  const next = usePlayer((state) =>
    state.shuffle ? undefined : state.queue[state.currentIndex + 1]?.image,
  );
  useEffect(() => {
    if (next) void client.prefetchQuery(seedQuery(next));
  }, [client, next]);
}

/**
 * The D3 colours for the current track's artwork in the app's colour scheme,
 * or `null` for the D1 palette: nothing playing, the colours still loading
 * for the first track, extraction failed, or a contrast minimum missed. While
 * the next track's colours load the previous ones stay, so the wash changes
 * once; a failure (offline included: the query runs whatever the network
 * says) drops them for the D1 palette instead of keeping the last cover's.
 */
export function usePlayerColors(
  image: string | undefined,
): PlayerColors | null {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const src = image ? getImageSrc(image, "low") : "";
  const { data: seed } = useQuery({
    ...seedQuery(image ?? ""),
    placeholderData: keepPreviousData,
  });
  usePrefetchNextSeed();
  return useMemo(
    () =>
      src && seed
        ? playerColorsFromSeed(
            seed,
            scheme,
            Platform.OS === "ios" ? "ios" : "android",
          )
        : null,
    [src, seed, scheme],
  );
}
