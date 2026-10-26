import * as plain from "./accent-palette";
import * as android from "./accent-palette.android";
import { ACCENT_IDS, accentColors, colors } from "./tokens";

const ACCENTED = ACCENT_IDS.filter((id) => id !== "default");

describe("withAccent (Android)", () => {
  it.each(["light", "dark"] as const)(
    "builds every role from the accent seed, %s",
    (scheme) => {
      for (const accent of ACCENTED) {
        const palette = android.withAccent(colors[scheme], accent, scheme);
        // Containers follow the accent, not the base (wallpaper) palette.
        for (const token of ["card", "secondary", "accent", "muted"] as const) {
          expect([accent, token, palette[token]]).not.toEqual([
            accent,
            token,
            colors[scheme][token],
          ]);
        }
        // The alpha tokens stay the palette's.
        expect(palette.fill).toBe(colors[scheme].fill);
        expect(palette.scrim).toBe(colors[scheme].scrim);
      }
    },
  );

  it("gives each accent its own scheme and reuses it", () => {
    const blue = android.withAccent(colors.light, "blue", "light");
    const green = android.withAccent(colors.light, "green", "light");
    expect(blue.secondary).not.toBe(green.secondary);
    expect(android.withAccent(colors.light, "blue", "light")).toBe(blue);
  });

  it("keeps the base palette for the default accent", () => {
    expect(android.withAccent(colors.dark, "default", "dark")).toBe(
      colors.dark,
    );
  });

  it("replaces every colour class variable", () => {
    expect(android.ACCENTED_TOKENS).toContain("card");
    expect(android.ACCENTED_TOKENS).toContain("secondary-foreground");
  });
});

describe("withAccent (iOS)", () => {
  it("replaces only primary and its text over the system colours", () => {
    const preset = accentColors("pink", "light");
    expect(plain.withAccent(colors.light, "pink", "light")).toEqual({
      ...colors.light,
      primary: preset?.primary,
      "primary-foreground": preset?.foreground,
    });
    expect(plain.ACCENTED_TOKENS).toEqual(["primary", "primary-foreground"]);
  });
});
