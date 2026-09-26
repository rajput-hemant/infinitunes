import CryptoJS from "crypto-js";

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
    // Pure-JS DES-ECB: Node 22 / OpenSSL 3 removed single-DES from
    // `node:crypto` (ERR_OSSL_EVP_UNSUPPORTED), so decrypt here instead of
    // via createDecipheriv("des-ecb"). Upstream uses PKCS#7 padding.
    const decrypted = CryptoJS.DES.decrypt(
      CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(encryptedMediaUrl),
      }),
      CryptoJS.enc.Utf8.parse(desKey),
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 },
    ).toString(CryptoJS.enc.Utf8);

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
  } catch (error) {
    console.error("[createDownloadLinks] failed to decrypt media URL", error);
    return "";
  }
}
