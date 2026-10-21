import type { MediaType } from "@infinitunes/types";
import { Share } from "react-native";

import { entityPath } from "~/navigation/entity-href";

import { env } from "./env";

/** An item the share sheet offers: its decoded name, its type and its perma URL. */
export type ShareableItem = { name: string; type: MediaType; url: string };

/**
 * The web app's page for an upstream item: its entity path (the same as the
 * app's) on the web origin, or the perma URL's own path when it is not one.
 */
export function webPageUrl({ type, url }: Omit<ShareableItem, "name">) {
  return (
    env.apiUrl + (entityPath(type, url) ?? url.replace(/^https?:\/\/[^/]+/, ""))
  );
}

/** Opens the system share sheet for an item's web page. */
export function shareItem(item: ShareableItem) {
  const link = webPageUrl(item);
  // iOS shares `url` as a link and `message` as text; Android takes only `message`.
  void Share.share({
    title: item.name,
    message: `${item.name} ${link}`,
    url: link,
  });
}
