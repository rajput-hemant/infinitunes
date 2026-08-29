import { createDecipheriv } from "node:crypto";

/**
 * Decrypts a JioSaavn `encrypted_media_url` (base64 DES-ECB) into a playable
 * media URL. This is the only server-side transformation allowed on otherwise
 * raw upstream payloads, because it requires the secret DES key from the env.
 */
export function createDownloadLinks(
  encryptedMediaUrl: string | undefined,
): string {
  // Read lazily: Next.js and test runners can populate the env after this
  // module is first evaluated, and a key captured too early stays empty.
  const desKey = process.env.JIOSAAVN_DES_KEY ?? "";
  if (!encryptedMediaUrl || !desKey) return "";

  try {
    const decipher = createDecipheriv(
      "des-ecb",
      Buffer.from(desKey, "utf8"),
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

    const [_full, path, ext] = match;
    // The decrypted URL already carries a bitrate suffix (usually `_96` or
    // `_160`). It has to be replaced, not appended to: the CDN 404s on
    // `..._96_320.mp4`.
    const base = path.replace(/_(?:12|48|96|160|320)$/, "");
    const bitrates = ["_12", "_48", "_96", "_160", "_320"];
    return bitrates.map((id) => `${base}${id}${ext}`).join(",");
  } catch {
    return "";
  }
}
