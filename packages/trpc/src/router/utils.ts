import { parseToken } from "@infinitunes/types";

import { api } from "../lib/api";
import { createDownloadLinks } from "../lib/download";
import { endpoints } from "../lib/endpoints";

export function tokenFromLink(link: string): string {
  return parseToken(link);
}

export function resolveNumericId(
  t: string,
  type: "album" | "playlist",
): Promise<string> {
  if (/^\d+$/.test(t)) return Promise.resolve(t);
  const result = api(endpoints[type].link, {
    query: { token: t, type },
  }) as Promise<{ id?: string }>;
  return result.then((r) => r.id ?? t);
}

export function withDownloadUrl(item: unknown): Record<string, unknown> {
  const obj = item as Record<string, unknown>;
  const more = obj.more_info as Record<string, unknown> | undefined;
  if (more && typeof more.encrypted_media_url === "string") {
    const url = createDownloadLinks(more.encrypted_media_url);
    if (url) {
      obj.download_url = url;
      more.download_url = url;
    }
  }
  return obj;
}
