/**
 * Renders every app icon PNG from the master vector `assets/brand/glyph.svg`
 * (the mark alone; `assets/brand/icon.svg` is the same mark on the iOS light
 * background, kept as the reviewable master). Run with `bun run mobile:icons`
 * from the repo root and commit the PNGs: builds never run this script.
 *
 * Geometry (1024 canvas): the glyph path lives in the traced logo's own space,
 * its box centred on (GLYPH_CENTER) with a half-diagonal reach of GLYPH_REACH.
 *  - iOS: full-bleed square, no rounding/gloss (the OS masks it), glyph at 0.58 (about 55% of the tile, as system icons are).
 *  - Android adaptive: 108dp canvas, the launcher may crop to a 66dp circle
 *    (radius 313px here), so reach * scale must stay below that; the glyph is
 *    sized to Material's 48dp keyline (about 46% of the canvas) so tighter
 *    launcher masks (One UI's squircle) never clip it.
 *  - Splash: glyph only, inside the 2/3 circle Android 12 masks to.
 */
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandDir = path.join(root, "assets", "brand");
const assetsDir = path.join(root, "assets");

const GLYPH_CENTER = { x: 619, y: 662 } as const;
/** Farthest glyph pixel from GLYPH_CENTER, in glyph units (measured on the trace). */
const GLYPH_REACH = 518;
const GLYPH_HEIGHT = 964;
const ADAPTIVE_SAFE_RADIUS = (1024 * 66) / 108 / 2;

const IOS_SCALE = 0.58;
const ADAPTIVE_SCALE = 0.48;
const SPLASH_SCALE = 0.64;

const NOTIFICATION_SIZE = 96;
const NOTIFICATION_GLYPH_HEIGHT = 80;

// Brand surfaces from `src/theme/tokens.ts` (dark background).
const DARK_TOP = "#14211e";
const DARK_BOTTOM = "#0b0b0c";

async function readGlyph() {
  const svg = await readFile(path.join(brandDir, "glyph.svg"), "utf8");
  const d = /<path fill="url\(#ribbon\)" d="([^"]+)"/.exec(svg)?.[1];
  const gradient = /<linearGradient id="ribbon"[\s\S]*?<\/linearGradient>/.exec(
    svg,
  )?.[0];
  if (!d || !gradient)
    throw new Error("glyph.svg: path or ribbon gradient not found");
  return { d, gradient };
}

type Layer = {
  /** Canvas edge in px. */
  size?: number;
  scale: number;
  /** Paint for the glyph: the brand gradient, or a flat/alternate fill. */
  fill: string;
  defs?: string;
  background?: string;
};

function compose(glyph: { d: string }, layer: Layer): string {
  const size = layer.size ?? 1024;
  const mid = size / 2;
  const mark =
    layer.fill === "none"
      ? ""
      : `<g transform="translate(${mid} ${mid}) scale(${layer.scale}) translate(${-GLYPH_CENTER.x} ${-GLYPH_CENTER.y})"><path fill="${layer.fill}" d="${glyph.d}"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>${layer.defs ?? ""}</defs>
  ${layer.background ?? ""}
  ${mark}
</svg>`;
}

function verticalGradient(id: string, stops: [string, string]) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${stops[0]}"/><stop offset="1" stop-color="${stops[1]}"/></linearGradient>`;
}

async function render(svg: string, file: string, opaque: boolean) {
  const image = sharp(Buffer.from(svg), { density: 72 });
  // The iOS tiles and the adaptive background ship without an alpha channel.
  const out = opaque
    ? image.flatten({ background: "#000000" }).removeAlpha()
    : image;
  await out.png({ compressionLevel: 9 }).toFile(path.join(assetsDir, file));
  console.log(`wrote assets/${file}`);
}

async function main() {
  if (GLYPH_REACH * ADAPTIVE_SCALE > ADAPTIVE_SAFE_RADIUS) {
    throw new Error("adaptive glyph leaves the 66dp safe zone");
  }
  if (GLYPH_REACH * SPLASH_SCALE > 1024 / 3)
    throw new Error("splash glyph exceeds the Android 12 mask");

  await mkdir(assetsDir, { recursive: true });
  const glyph = await readGlyph();
  const ribbon = glyph.gradient;
  const bgRect = `<rect width="1024" height="1024" fill="url(#bg)"/>`;

  // iOS 26: light, dark, tinted (Apple recolours the luminance, so grayscale on black).
  await render(
    compose(glyph, {
      scale: IOS_SCALE,
      fill: "url(#ribbon)",
      defs: ribbon + verticalGradient("bg", ["#ffffff", "#e6f7f2"]),
      background: bgRect,
    }),
    "icon.png",
    true,
  );
  await render(
    compose(glyph, {
      scale: IOS_SCALE,
      fill: "url(#ribbon)",
      defs: ribbon + verticalGradient("bg", [DARK_TOP, DARK_BOTTOM]),
      background: bgRect,
    }),
    "icon-dark.png",
    true,
  );
  await render(
    compose(glyph, {
      scale: IOS_SCALE,
      fill: "url(#gray)",
      defs: verticalGradient("gray", ["#ffffff", "#9a9a9a"]),
      background: `<rect width="1024" height="1024" fill="#000000"/>`,
    }),
    "icon-tinted.png",
    true,
  );

  // Android adaptive layers (108dp canvas mapped to 1024px).
  await render(
    compose(glyph, {
      scale: ADAPTIVE_SCALE,
      fill: "url(#ribbon)",
      defs: ribbon,
    }),
    "adaptive-foreground.png",
    false,
  );
  await render(
    compose(glyph, {
      scale: ADAPTIVE_SCALE,
      fill: "none",
      defs: verticalGradient("bg", [DARK_TOP, DARK_BOTTOM]),
      background: bgRect,
    }),
    "adaptive-background.png",
    true,
  );
  await render(
    compose(glyph, { scale: ADAPTIVE_SCALE, fill: "#ffffff" }),
    "adaptive-monochrome.png",
    false,
  );

  // Splash: glyph only on transparent; the plugin supplies the background colour.
  await render(
    compose(glyph, { scale: SPLASH_SCALE, fill: "url(#ribbon)", defs: ribbon }),
    "splash-icon.png",
    false,
  );

  // Android status-bar icon: white on transparent, no colour.
  await render(
    compose(glyph, {
      size: NOTIFICATION_SIZE,
      scale: NOTIFICATION_GLYPH_HEIGHT / GLYPH_HEIGHT,
      fill: "#ffffff",
    }),
    "notification-icon.png",
    false,
  );
}

await main();
