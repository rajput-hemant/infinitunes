import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import resolveConfig from "tailwindcss/resolveConfig";

import tailwindConfig from "../../tailwind.config";
import { spacingScale } from "./tokens";

const SRC = path.resolve(__dirname, "..");

/** Every app source file; tests use test ids like `pl-1` that read as classes. */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "test" ? [] : sources(file);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [file]
      : [];
  });
}

const SIDES = ["", "x", "y", "t", "b", "l", "r", "s", "e"];

/** Every utility that takes a theme scale, with the resolved `theme` key it reads. */
const UTILITIES: Record<string, string> = {
  ...Object.fromEntries(SIDES.map((side) => [`p${side}`, "padding"])),
  ...Object.fromEntries(SIDES.map((side) => [`m${side}`, "margin"])),
  ...Object.fromEntries(
    SIDES.map((side) => [`scroll-m${side}`, "scrollMargin"]),
  ),
  ...Object.fromEntries(
    SIDES.map((side) => [`scroll-p${side}`, "scrollPadding"]),
  ),
  gap: "gap",
  "gap-x": "gap",
  "gap-y": "gap",
  "space-x": "space",
  "space-y": "space",
  inset: "inset",
  "inset-x": "inset",
  "inset-y": "inset",
  top: "inset",
  bottom: "inset",
  left: "inset",
  right: "inset",
  start: "inset",
  end: "inset",
  "translate-x": "translate",
  "translate-y": "translate",
  w: "width",
  h: "height",
  size: "size",
  "min-w": "minWidth",
  "min-h": "minHeight",
  "max-w": "maxWidth",
  "max-h": "maxHeight",
  basis: "flexBasis",
  indent: "textIndent",
  "border-spacing": "borderSpacing",
  "border-spacing-x": "borderSpacing",
  "border-spacing-y": "borderSpacing",
};

/**
 * Tailwind's theme as the app resolves it (the real config: the closed spacing
 * scale plus the preset). Each utility reads its own key, which has its own
 * extras: `w-1/4` and `w-screen` exist, `min-h-1/2` does not.
 */
const THEME = resolveConfig(tailwindConfig).theme as unknown as Record<
  string,
  Record<string, unknown>
>;

/** Longest first, so `gap-x` wins over `gap` and `scroll-px` over `scroll-p`. */
const NAMES = Object.keys(UTILITIES).toSorted((a, b) => b.length - a.length);

/**
 * A class of one of those utilities, after a class separator or a variant
 * (`active:`), with an optional `!` (important) and `-` (negative) prefix and
 * any value: numeric, fractional, named (`min-h-hero`) or arbitrary (`h-[3px]`).
 */
const CLASS = new RegExp(
  `(?<=^|[\\s"'\`:{(])(!?-?(?:${NAMES.join("|")})-(?:\\[[^\\]]*\\]|[\\w./]+))`,
  "gm",
);

/** Comments hold prose (`top-to-bottom`, `end-of-track`) that reads as classes. */
function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
}

/** The classes in `text` whose value is not in their utility's resolved theme. */
function offTheme(text: string): string[] {
  return [...withoutComments(text).matchAll(CLASS)].flatMap(
    ([, match = ""]) => {
      const [, utility = "", value = ""] =
        new RegExp(`^!?-?(${NAMES.join("|")})-(.+)$`).exec(match) ?? [];
      const key = UTILITIES[utility];
      const name = value.replace(/[./]+$/, "");
      return key && !Object.hasOwn(THEME[key] ?? {}, name) ? [match] : [];
    },
  );
}

const ALLOWED = new Set(Object.keys(spacingScale));

describe("spacing scale", () => {
  it("is closed to the 4pt steps and the named sizes", () => {
    expect(Object.keys(spacingScale).toSorted()).toEqual(
      [
        "0",
        "1",
        "2",
        "3",
        "4",
        "6",
        "8",
        "12",
        "px",
        "ctl",
        "touch",
        "row",
        "row-2",
        "page",
        "dock",
        "seam",
        "readable",
      ].toSorted(),
    );
  });

  it("resolves the closed scale into the spacing utilities' themes", () => {
    for (const key of [
      "padding",
      "margin",
      "gap",
      "scrollMargin",
      "scrollPadding",
      "textIndent",
      "borderSpacing",
    ]) {
      const names = Object.keys(THEME[key] ?? {}).filter((n) => n !== "auto");
      expect(names.toSorted()).toEqual([...ALLOWED, "full"].toSorted());
    }
  });

  it("checks each class against its own utility's theme", () => {
    expect(
      offTheme(
        [
          "p-2 -mt-3 !px-4 active:gap-x-6 w-1/4 w-screen h-full size-touch",
          "min-w-0 inset-1/2 -translate-x-1/2 top-px max-w-full",
        ].join(" "),
      ),
    ).toEqual([]);
    // Off the scale, fractions where the utility has none, `!`-prefixed and
    // named values that do not exist, and the less common utilities.
    expect(offTheme("// top-to-bottom, end-of-track\n/* p-5 */")).toEqual([]);
    const bad = [
      "p-5",
      "min-h-1/2",
      "!gap-5",
      "!min-h-hero",
      "min-h-hero",
      "scroll-m-5",
      "scroll-px-7",
      "indent-5",
      "border-spacing-5",
      "translate-x-3/5",
      "w-[3px]",
      "-mt-9",
    ];
    expect(offTheme(bad.join(" "))).toEqual(bad);
  });

  // NativeWind drops a class it cannot compile without a warning, so an off-scale
  // step would lay out as if it were not there.
  it("is the only spacing the app's classes use", () => {
    const offScale = sources(SRC).flatMap((file) =>
      offTheme(readFileSync(file, "utf8")).map(
        (match) => `${path.relative(SRC, file)}: ${match}`,
      ),
    );
    expect(offScale).toEqual([]);
  });
});
