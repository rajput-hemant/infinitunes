import { colors, iosSystemColors } from "./tokens";
import type { ColorScheme, ColorToken } from "./tokens";

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
];

describe("colour tokens", () => {
  describe.each(SCHEMES)("%s palette", (scheme) => {
    const palette = colors[scheme];
    const opaque = (token: ColorToken) => parse(palette[token]);

    it.each(TEXT_PAIRS)("%s on %s meets 4.5:1", (text, surface) => {
      expect(contrast(opaque(text), opaque(surface))).toBeGreaterThanOrEqual(
        4.5,
      );
    });

    // Placeholders sit on `fill`; `fill-2` only ever carries default-tone text.
    it("muted text on fill over the background meets 4.5:1", () => {
      const surface = flatten(opaque("fill"), opaque("background"));
      expect(
        contrast(opaque("muted-foreground"), surface),
      ).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("keeps text colours that miss AA out of the iOS system mapping", () => {
    // secondaryLabel and systemRed are 3.1-3.6:1 on light surfaces.
    expect(iosSystemColors["muted-foreground"]).toBeUndefined();
    expect(iosSystemColors.destructive).toBeUndefined();
  });
});
