import type { Metadata } from "next";

import { ogImageUrl } from "~/lib/utils";

type PageMetadataInput = {
  title: string;
  description: string;
  /** Canonical path, e.g. `/album/<name>/<token>`. */
  url: string;
  /** Artwork for the OG card (absolute URL or path); omitted uses the local default. */
  image?: string;
  /** Alt text for the OG image; defaults to `title`. */
  alt?: string;
  /** Crop the OG artwork to a square (entity artwork). */
  square?: boolean;
};

/**
 * Page title, description and OpenGraph card in one place. The OG image URL is
 * always built with `ogImageUrl`, so titles and descriptions are decoded and
 * percent-encoded rather than interpolated into the query string.
 */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const { title, description, url, image, alt = title, square } = input;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: {
        url: ogImageUrl({ title, description, image, square }),
        alt,
      },
    },
  };
}
