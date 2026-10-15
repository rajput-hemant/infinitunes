import { decode } from "@infinitunes/types";
import type { Metadata } from "next";

import { siteUrl } from "~/lib/site-url";
import { ogImageUrl } from "~/lib/utils";

type PageMetadataInput = {
  title: string;
  description: string;
  /** Canonical path, e.g. `/album/<name>/<token>`. */
  url: string;
  /** Artwork for the OG card (absolute URL or path); omitted uses the local default. */
  image?: string;
  /** Alt text for the OG image; defaults to the title. */
  alt?: string;
  /** Crop the OG artwork to a square (entity artwork). */
  square?: boolean;
};

/**
 * Page title, description, canonical link and OpenGraph card in one place.
 * Upstream titles arrive HTML-encoded, so the text fields are decoded here; the
 * OG image URL gets the raw values because `ogImageUrl` decodes them itself.
 */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const { url, image, square } = input;
  const title = decode(input.title);
  const description = decode(input.description);
  const canonical = siteUrl(url);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: {
        url: ogImageUrl({
          title: input.title,
          description: input.description,
          image,
          square,
        }),
        alt: input.alt ?? title,
      },
    },
  };
}

/** Keeps a route out of search results: user pages, settings and sign-in. */
export const noindexMetadata = {
  robots: { index: false },
} satisfies Metadata;
