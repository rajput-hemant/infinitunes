import { parseToken } from "@infinitunes/types";

import { api } from "../lib/api";
import { createDownloadLinks } from "../lib/download";
import { endpoints } from "../lib/endpoints";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when `value[key]` is present in the same sense as `if (!payload[key])`. */
export function hasIdentity(
  value: unknown,
  key: string,
): value is Record<string, unknown> {
  return isRecord(value) && Boolean(value[key]);
}

export function tokenFromLink(link: string): string {
  return parseToken(link);
}

export async function resolveNumericId(
  t: string,
  type: "album" | "playlist",
): Promise<string> {
  if (/^\d+$/.test(t)) return t;
  const result = await api(endpoints[type].link, {
    query: { token: t, type },
  });
  if (!isRecord(result) || result.id == null) return t;
  return typeof result.id === "string" ? result.id : String(result.id);
}

export function withDownloadUrl<T>(item: T): T {
  if (!isRecord(item)) return item;
  const record: Record<string, unknown> = item;
  const more = record.more_info;
  if (!isRecord(more) || typeof more.encrypted_media_url !== "string") {
    return item;
  }
  const url = createDownloadLinks(more.encrypted_media_url);
  if (url) {
    record.download_url = url;
    more.download_url = url;
  }
  return item;
}

export function mapDownloadUrls(value: unknown, key: string): void {
  if (!isRecord(value)) return;
  const list = value[key];
  if (!Array.isArray(list)) return;
  value[key] = list.map((item) => withDownloadUrl(item));
}
