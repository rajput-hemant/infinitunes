import { createDecipheriv } from "node:crypto";

const DES_KEY = process.env.JIOSAAVN_DES_KEY ?? "";

/**
 * Decrypts a JioSaavn `encrypted_media_url` (base64 DES-ECB) into a playable
 * media URL. This is the only server-side transformation allowed on otherwise
 * raw upstream payloads, because it requires the secret DES key from the env.
 */
export function createDownloadLinks(
  encryptedMediaUrl: string | undefined,
): string {
  if (!encryptedMediaUrl || !DES_KEY) return "";

  try {
    const decipher = createDecipheriv(
      "des-ecb",
      Buffer.from(DES_KEY, "utf8"),
      null,
    );
    decipher.setAutoPadding(true);
    const decrypted =
      decipher.update(
        Buffer.from(encryptedMediaUrl, "base64"),
        undefined,
        "utf8",
      ) + decipher.final("utf8");

    const match = decrypted.match(
      /^(https?:\/\/\S+?)(\.(?:mp4|m4a|mp3))(?:\?.*)?$/,
    );
    if (!match) return decrypted;

    const [_full, base, ext] = match;
    const bitrates = ["_12", "_48", "_96", "_160", "_320"];
    const out: string[] = [];
    for (const id of bitrates) {
      out.push(`${base}${id}${ext}`);
    }
    return out.join(",");
  } catch {
    return "";
  }
}
