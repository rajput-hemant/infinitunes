import {
  argbFromHex,
  Hct,
  hexFromArgb,
  SchemeTonalSpot,
} from "@material/material-color-utilities";

import * as plainAccent from "./accent-palette";
import * as androidAccent from "./accent-palette.android";
import { withDynamicRoles } from "./dynamic-palette";
import {
  ACCENTS,
  ACCENT_IDS,
  androidDynamicColors,
  androidEmphasizedWeights,
  COLOR_TOKENS,
  colors,
  iosSystemColors,
  swipeFills,
  typeScale,
} from "./tokens";
import type { ColorScheme, ColorToken, Palette } from "./tokens";

type Rgba = readonly [number, number, number, number];

function parse(color: string): Rgba {
  if (color.startsWith("#")) {
    return [
      Number.parseInt(color.slice(1, 3), 16),
      Number.parseInt(color.slice(3, 5), 16),
      Number.parseInt(color.slice(5, 7), 16),
      1,
    ];
  }
  const [r = 0, g = 0, b = 0, a = 1] = (color.match(/[\d.]+/g) ?? []).map(
    Number,
  );
  return [r, g, b, a];
}

/** `foreground` laid over an opaque `background`. */
function flatten(foreground: Rgba, background: Rgba): Rgba {
  const [r, g, b, a] = foreground;
  return [
    r * a + background[0] * (1 - a),
    g * a + background[1] * (1 - a),
    b * a + background[2] * (1 - a),
    1,
  ];
}

function channel(value: number): number {
  const unit = value / 255;
  return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgba): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground: Rgba, background: Rgba): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const SCHEMES: readonly ColorScheme[] = ["light", "dark"];

/** Every text colour with the surfaces it is set on (WCAG AA, 4.5:1). */
const TEXT_PAIRS: readonly (readonly [ColorToken, ColorToken])[] = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "secondary"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"],
  ["destructive", "background"],
  ["destructive", "card"],
  // `tone="primary"`: the playing row's title.
  ["primary", "background"],
  ["primary", "card"],
];

/** Every pair's contrast, and muted text on a placeholder's `fill`. */
function lowestContrasts(palette: Palette) {
  const opaque = (token: ColorToken) => parse(palette[token]);
  const pairs = TEXT_PAIRS.map(
    ([text, surface]) =>
      [
        `${text} on ${surface}`,
        contrast(opaque(text), opaque(surface)),
      ] as const,
  );
  // Placeholders sit on `fill`; `fill-2` only ever carries default-tone text.
  const fill = flatten(opaque("fill"), opaque("background"));
  return [
    ...pairs,
    ["muted-foreground on fill", contrast(opaque("muted-foreground"), fill)],
  ] as const;
}

describe("colour tokens", () => {
  describe.each(SCHEMES)("%s palette", (scheme) => {
    it.each(lowestContrasts(colors[scheme]))("%s meets 4.5:1", (_, ratio) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  // iOS: the accent replaces `primary` and its text over the system colours.
  // Android: it is the seed of a whole tonal spot scheme. Every preset in
  // both schemes, on both platforms.
  describe.each(
    ACCENT_IDS.filter((id) => id !== "default").flatMap((id) =>
      SCHEMES.flatMap((scheme) =>
        (["ios", "android"] as const).map(
          (platform) => [id, scheme, platform] as const,
        ),
      ),
    ),
  )("%s accent, %s, %s", (accent, scheme, platform) => {
    const { withAccent } = platform === "ios" ? plainAccent : androidAccent;
    const palette = withAccent(colors[scheme], accent, scheme);
    it.each(lowestContrasts(palette))("%s meets 4.5:1", (_, ratio) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("keeps text colours that miss AA out of the iOS system mapping", () => {
    // secondaryLabel and systemRed are 3.1-3.6:1 on light surfaces.
    expect(iosSystemColors["muted-foreground"]).toBeUndefined();
    expect(iosSystemColors.destructive).toBeUndefined();
  });
});

/**
 * Android 12+ derives its scheme from the wallpaper (Material You's tonal
 * spot), which no test can pin. Material's tone design keeps role pairs
 * apart, so check that our role mapping keeps every text pair at AA across
 * seeds round the hue circle, greys and both spec versions. Only the tonal
 * spot variant at standard contrast (level 0) is generated: other variants
 * (vibrant, expressive...) and the system's medium/high contrast levels are
 * not covered.
 */
describe("Material You colour roles", () => {
  const SEEDS = [
    ...Array.from({ length: 12 }, (_, step) =>
      Hct.from(step * 30, 48, 50).toInt(),
    ),
    argbFromHex("#6750a4"), // Material's baseline seed
    argbFromHex("#808080"),
    argbFromHex("#ffd400"), // a light, high-chroma wallpaper
    // The accent presets, which seed the scheme on Android.
    ...Object.values(ACCENTS).flatMap((preset) =>
      preset ? [argbFromHex(preset.light), argbFromHex(preset.dark)] : [],
    ),
  ];
  const SPECS = ["2021", "2025"] as const;

  const cases = SPECS.flatMap((spec) =>
    SEEDS.flatMap((seed) =>
      SCHEMES.map((scheme) => [spec, hexFromArgb(seed), scheme] as const),
    ),
  );

  it.each(cases)(
    "spec %s, seed %s, %s: every text pair meets 4.5:1",
    (spec, seed, scheme) => {
      const roles = new SchemeTonalSpot(
        Hct.fromInt(argbFromHex(seed)),
        scheme === "dark",
        0,
        spec,
      );
      // Our roles are all DynamicScheme getters (an ARGB number each).
      const palette = withDynamicRoles(colors[scheme], (role) =>
        hexFromArgb(Reflect.get(roles, role)),
      );
      for (const [pair, ratio] of lowestContrasts(palette)) {
        expect([pair, ratio >= 4.5]).toEqual([pair, true]);
      }
    },
  );

  it("maps every opaque token and leaves the alpha ones alone", () => {
    const mapped = Object.keys(androidDynamicColors);
    expect(mapped).toEqual(
      COLOR_TOKENS.filter((token) => !/^(fill|scrim)/.test(token)),
    );
  });
});

describe("swipeFills", () => {
  it.each(Object.entries(swipeFills))(
    "%s carries a white glyph at AA",
    (_name, fill) => {
      expect(contrast(parse("#ffffff"), parse(fill))).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );
});

describe("Android ink type scale", () => {
  const styles = Object.entries(typeScale.android) as [
    keyof typeof typeScale.android,
    (typeof typeScale.android)["body"],
  ][];

  it("never clips a line", () => {
    for (const [, style] of styles) {
      expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
    }
  });

  it("sets the headlines bold, tight and loudest", () => {
    expect(typeScale.android.largeTitle.fontWeight).toBe("700");
    expect(typeScale.android.title1.fontWeight).toBe("700");
    expect(typeScale.android.largeTitle.letterSpacing).toBeLessThan(0);
    expect(typeScale.android.title1.fontSize).toBeGreaterThan(
      typeScale.android.title2.fontSize,
    );
  });

  it("emphasizes a weight up, never below the base", () => {
    for (const [variant, style] of styles) {
      const base = Number(style.fontWeight);
      const emphasized = Number(androidEmphasizedWeights[variant]);
      expect(emphasized).toBeGreaterThanOrEqual(base);
      expect(emphasized - base).toBeLessThanOrEqual(200);
    }
  });
});
