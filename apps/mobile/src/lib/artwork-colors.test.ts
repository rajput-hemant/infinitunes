import { Hct, hexFromArgb } from "@material/material-color-utilities";

import {
  contrastRatio,
  meetsContrast,
  MIN_CONTROL_CONTRAST,
  MIN_TEXT_CONTRAST,
  mix,
  playerColorsFromSeed,
  seedFromImageColors,
} from "./artwork-colors";
import type { PlayerColors, WashPlatform } from "./artwork-colors";

const SCHEMES = ["light", "dark"] as const;
const PLATFORMS: readonly WashPlatform[] = ["ios", "android"];

/** Covers of every hue, from grey to neon, from near black to near white. */
const SEEDS = Array.from({ length: 24 }, (_, step) => step * 15).flatMap(
  (hue) =>
    [0, 8, 24, 48, 90, 130].flatMap((chroma) =>
      [4, 25, 50, 75, 96].map((tone) =>
        hexFromArgb(Hct.from(hue, chroma, tone).toInt()),
      ),
    ),
);

function colorsFor(
  seed: string,
  scheme: "light" | "dark",
  platform: WashPlatform,
) {
  const colors = playerColorsFromSeed(seed, scheme, platform);
  if (!colors) throw new Error(`${seed} ${scheme} ${platform} fell back`);
  return colors;
}

const hctOf = (hex: string) => Hct.fromInt(Number.parseInt(hex.slice(1), 16));
const hue = (hex: string) => hctOf(hex).hue;

describe("contrastRatio", () => {
  it("follows WCAG 2", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
    // The WCAG reference grey that just reaches 4.5:1 on white.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#3b0f12", "#fbecea")).toBe(
      contrastRatio("#fbecea", "#3b0f12"),
    );
  });
});

describe("mix", () => {
  it("blends in sRGB", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#102030", "#102030", 0.3)).toBe("#102030");
    expect(mix("#ff0000", "#0000ff", 1)).toBe("#0000ff");
  });
});

describe("playerColorsFromSeed", () => {
  it.each(
    PLATFORMS.flatMap((platform) =>
      SCHEMES.map((scheme) => [platform, scheme] as const),
    ),
  )(
    "derives a palette that passes for every cover (%s, %s)",
    (platform, scheme) => {
      for (const seed of SEEDS) {
        const colors = colorsFor(seed, scheme, platform);
        expect(meetsContrast(colors)).toBe(true);
        expect(colors.scheme).toBe(scheme);
      }
    },
  );

  it("follows the colour scheme: a deep wash in dark mode, a pale one in light", () => {
    for (const platform of PLATFORMS) {
      const dark = colorsFor("#5b0f12", "dark", platform);
      const light = colorsFor("#5b0f12", "light", platform);
      // Light text on the dark wash, dark text on the light one.
      expect(contrastRatio(dark.foreground, "#000000")).toBeGreaterThan(
        contrastRatio(dark.foreground, "#ffffff"),
      );
      expect(contrastRatio(light.foreground, "#ffffff")).toBeGreaterThan(
        contrastRatio(light.foreground, "#000000"),
      );
    }
  });

  it("keeps the artwork's hue in the wash", () => {
    const red = colorsFor("#c2372f", "dark", "ios");
    const blue = colorsFor("#1f4fbf", "dark", "ios");
    expect(Math.abs(hue(red.wash[0]) - 27)).toBeLessThan(30);
    expect(Math.abs(hue(blue.wash[0]) - 270)).toBeLessThan(30);
  });

  it("leaves a grey cover grey", () => {
    const { wash } = colorsFor("#808080", "dark", "ios");
    for (const stop of wash) {
      expect(
        Hct.fromInt(Number.parseInt(stop.slice(1), 16)).chroma,
      ).toBeLessThan(4);
    }
  });

  it("falls back for a seed that is not a colour", () => {
    expect(playerColorsFromSeed("red", "dark", "ios")).toBeNull();
    expect(playerColorsFromSeed("#fff", "dark", "android")).toBeNull();
    expect(playerColorsFromSeed("", "light", "ios")).toBeNull();
  });
});

describe("meetsContrast", () => {
  const good = colorsFor("#5b0f12", "dark", "ios");
  const breaking = (change: Partial<PlayerColors>): PlayerColors => ({
    ...good,
    ...change,
  });

  it("rejects text under 4.5:1 anywhere on the wash", () => {
    // Fine on the dark bottom stop, not on a light top stop.
    expect(meetsContrast(breaking({ wash: ["#d0d0d0", good.wash[1]] }))).toBe(
      false,
    );
    expect(meetsContrast(breaking({ muted: good.wash[0] }))).toBe(false);
  });

  it("rejects a gradient whose middle fails though both ends pass", () => {
    // Black text passes on red and on green, but their sRGB blend is a
    // darker olive the gradient really draws.
    const wash = ["#ee0000", "#00ad00"] as const;
    expect(contrastRatio("#000000", wash[0])).toBeGreaterThan(4.5);
    expect(contrastRatio("#000000", wash[1])).toBeGreaterThan(4.5);
    expect(contrastRatio("#000000", mix(...wash, 0.5))).toBeLessThan(4.5);
    const colors = breaking({
      wash,
      foreground: "#000000",
      muted: "#000000",
      accent: "#000000",
      control: "#000000",
      onControl: "#ffffff",
    });
    expect(meetsContrast(colors)).toBe(false);
    expect(meetsContrast({ ...colors, wash: [wash[0], wash[0]] })).toBe(true);
  });

  it("rejects controls under 3:1 and glyphs under 4.5:1 on the play shape", () => {
    expect(meetsContrast(breaking({ control: good.wash[1] }))).toBe(false);
    expect(meetsContrast(breaking({ onControl: good.control }))).toBe(false);
    expect(meetsContrast(breaking({ accent: good.wash[0] }))).toBe(false);
  });

  it("checks the dock's surface too", () => {
    expect(
      meetsContrast(
        breaking({ dock: { ...good.dock, muted: good.dock.background } }),
      ),
    ).toBe(false);
  });

  it("rejects malformed colours", () => {
    expect(meetsContrast(breaking({ foreground: "white" }))).toBe(false);
  });

  it("uses the WCAG minimums", () => {
    expect(MIN_TEXT_CONTRAST).toBe(4.5);
    expect(MIN_CONTROL_CONTRAST).toBe(3);
  });
});

describe("seedFromImageColors", () => {
  it("takes the cover's background on iOS and its dominant swatch on Android", () => {
    expect(
      seedFromImageColors({
        platform: "ios",
        background: "#5B0F12",
        primary: "#C2372F",
        secondary: "#F4E9E1",
        detail: "#000000",
        quality: "low",
      }),
    ).toBe("#5B0F12");
    expect(
      seedFromImageColors({
        platform: "android",
        dominant: "#5b0f12",
        average: "#444444",
        vibrant: "#c2372f",
        darkVibrant: "#000000",
        lightVibrant: "#ffffff",
        darkMuted: "#000000",
        lightMuted: "#ffffff",
        muted: "#888888",
      }),
    ).toBe("#5b0f12");
  });

  it("falls through to the next swatch, and to nothing", () => {
    expect(
      seedFromImageColors({
        platform: "ios",
        background: "",
        primary: "#C2372F",
        secondary: "",
        detail: "",
        quality: "low",
      }),
    ).toBe("#C2372F");
    expect(
      seedFromImageColors({
        platform: "web",
        dominant: "",
        vibrant: "",
        darkVibrant: "",
        lightVibrant: "",
        darkMuted: "",
        lightMuted: "",
        muted: "",
      }),
    ).toBeNull();
  });
});
