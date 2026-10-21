import { getImageSrc } from "@infinitunes/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Platform, useColorScheme } from "react-native";
import { getColors } from "react-native-image-colors";

import {
  playerColorsFromSeed,
  seedFromImageColors,
} from "~/lib/artwork-colors";
import type { PlayerColors } from "~/lib/artwork-colors";

/** One cache entry per artwork URL; a cover's colours never change. */
export function artworkColorsKey(src: string) {
  return ["artwork-colors", src] as const;
}

/**
 * The artwork's seed colour, read natively from the smallest rendition (the
 * extractor downloads it itself). Throws when nothing usable comes back, so
 * the player falls back to the D1 palette and a later mount tries again.
 */
async function fetchSeed(src: string): Promise<string> {
  const seed = seedFromImageColors(await getColors(src, { quality: "low" }));
  if (!seed) throw new Error(`No colour in ${src}`);
  return seed;
}

/**
 * The D3 colours for the current track's artwork in the app's colour scheme,
 * or `null` for the D1 palette: nothing playing, the colours still loading
 * for the first track, extraction failed, or a contrast minimum missed. While
 * the next track's colours load the previous ones stay, so the wash changes
 * once.
 */
export function usePlayerColors(
  image: string | undefined,
): PlayerColors | null {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const src = image ? getImageSrc(image, "low") : "";
  const { data: seed } = useQuery({
    queryKey: artworkColorsKey(src),
    queryFn: () => fetchSeed(src),
    enabled: src !== "",
    staleTime: Infinity,
    retry: false,
    placeholderData: keepPreviousData,
  });
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
