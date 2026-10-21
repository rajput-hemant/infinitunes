import { Share } from "react-native";

import { env } from "./env";

/**
 * The web app's page for an upstream item. The web routes mirror JioSaavn's
 * paths (and its proxy redirects the ones that differ, like artist tabs), so
 * the perma URL's path on the web origin is the item's page.
 */
export function webPageUrl(permaUrl: string): string {
  return env.apiUrl + permaUrl.replace(/^https?:\/\/[^/]+/, "");
}

/** Opens the system share sheet for an item's web page. */
export function shareItem({ name, url }: { name: string; url: string }) {
  const link = webPageUrl(url);
  // iOS shares `url` as a link and `message` as text; Android takes only `message`.
  void Share.share({ title: name, message: `${name} ${link}`, url: link });
}
