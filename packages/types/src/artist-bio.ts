import { decode } from "./media";

export type ArtistBioSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

/**
 * Windows-1252 code points that sit at 0x80-0x9F in that encoding (the rest of
 * the range maps straight from Latin-1). Used to turn mojibake back into bytes.
 */
const WIN1252_SPECIALS = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const ENCODABLE_RUN = new RegExp(
  `[\\u{0}-\\u{ff}${[...WIN1252_SPECIALS.keys()]
    .map((cp) => `\\u{${cp.toString(16)}}`)
    .join("")}]+`,
  "gu",
);

const UTF8 = new TextDecoder("utf-8", { fatal: true });

/** Re-reads one run of Latin-1/Windows-1252 characters as UTF-8, or keeps it. */
function repairRun(run: string): string {
  const bytes = Uint8Array.from(
    [...run],
    (ch) =>
      WIN1252_SPECIALS.get(ch.codePointAt(0) ?? 0) ?? ch.codePointAt(0) ?? 0,
  );
  try {
    return UTF8.decode(bytes);
  } catch {
    return run;
  }
}

/**
 * Repairs UTF-8 bytes that were decoded as Latin-1 or Windows-1252 (an
 * apostrophe read that way becomes three characters). Each run is only replaced when its bytes are valid UTF-8,
 * so ordinary accented text and characters outside the range pass through.
 */
export function repairMojibake(text: string): string {
  return text.replace(ENCODABLE_RUN, repairRun);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cleanText(text: string): string {
  return decode(repairMojibake(text)).trim();
}

/** Splits one section's text into paragraphs and bullet items (U+2022). */
function splitBody(
  text: string,
): Pick<ArtistBioSection, "paragraphs" | "bullets"> {
  const paragraphs: string[] = [];
  const bullets: string[] = [];

  for (const line of text.split(/\r\n|\r|\n/)) {
    const value = cleanText(line);
    if (!value) continue;

    if (value.startsWith("\u2022")) {
      const item = value.slice(1).trim();
      if (item) bullets.push(item);
    } else {
      paragraphs.push(value);
    }
  }

  return bullets.length > 0 ? { paragraphs, bullets } : { paragraphs };
}

function plainTextSection(text: string): ArtistBioSection[] {
  const body = splitBody(text);
  return body.paragraphs.length > 0 || body.bullets
    ? [{ title: "", ...body }]
    : [];
}

function sectionFrom(
  item: unknown,
): { sequence: number; section: ArtistBioSection } | undefined {
  if (!isRecord(item) || typeof item.text !== "string") return undefined;

  const body = splitBody(item.text);
  if (body.paragraphs.length === 0 && !body.bullets) return undefined;

  const sequence = Number(item.sequence);
  const title = typeof item.title === "string" ? cleanText(item.title) : "";

  return {
    sequence: Number.isFinite(sequence) ? sequence : Number.POSITIVE_INFINITY,
    section: { title, ...body },
  };
}

/**
 * Parses the upstream artist `bio` field into sections.
 *
 * Upstream sends a JSON-encoded array of `{ text, sequence, title }`. Values
 * that are not a JSON array or string are read as plain text. Sections are
 * ordered by `sequence`, mojibake and HTML entities are decoded, and empty
 * sections are dropped. Bullets (lines starting with U+2022) are returned separately and render after
 * a section's paragraphs.
 */
export function parseArtistBio(
  raw: string | null | undefined,
): ArtistBioSection[] {
  const value = raw?.trim() ?? "";
  if (!value) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return plainTextSection(value);
  }

  if (typeof parsed === "string") return plainTextSection(parsed);
  if (!Array.isArray(parsed)) return plainTextSection(value);

  return parsed
    .map(sectionFrom)
    .filter((entry) => entry !== undefined)
    .sort((a, b) => a.sequence - b.sequence)
    .map((entry) => entry.section);
}
