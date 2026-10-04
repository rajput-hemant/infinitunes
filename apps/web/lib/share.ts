export type SharePlatform =
  | "whatsapp"
  | "telegram"
  | "twitter"
  | "facebook"
  | "email";

type ShareTarget = { url: string; title: string };

/** Builds the share-intent URL for `platform`; all values are percent-encoded. */
export function buildShareUrl(
  platform: SharePlatform,
  { url, title }: ShareTarget,
): string {
  const u = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${u}&text=${text}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${text}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "email":
      return `mailto:?subject=${text}&body=${u}`;
  }
}
