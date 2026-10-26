import {
  labelPath,
  splitLabelSlug,
  type LabelTab,
} from "@infinitunes/core/entity-route";
import { getImageSrc } from "@infinitunes/types";
import type { Metadata } from "next";
import { cache } from "react";

import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";

/**
 * The label payload, memoized per request: the layout (metadata, header, tab
 * row) and the active tab's page all read it, and the catalog call underneath
 * is cached, so a tab switch is a cache hit.
 */
export const getLabel = cache(async (token: string) =>
  orNotFound(
    api.get.label({
      token,
      page: 0,
      n_song: 50,
      n_album: 50,
      cat: "popularity",
      sort: "asc",
    }),
  ),
);

export type LabelDetails = Awaited<ReturnType<typeof getLabel>>;

/**
 * Metadata for a label tab. Songs is the bare route, the label's canonical;
 * Albums is its own canonical page with its own title.
 */
export function labelTabMetadata(
  label: LabelDetails,
  name: string,
  token: string,
  tab: LabelTab,
): Metadata {
  return pageMetadata({
    title: tab === "albums" ? `Albums by ${label.name}` : label.name,
    description: "Record Label",
    url: labelPath(splitLabelSlug(name).name, token, tab),
    image: getImageSrc(label.image, "high"),
    square: true,
  });
}
