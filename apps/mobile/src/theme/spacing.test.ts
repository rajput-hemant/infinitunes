import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

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

/** Utilities that read `theme.spacing` (longest first, so `gap-x` wins over `gap`). */
const SPACING_UTILITIES = [
  "scroll-mx",
  "scroll-my",
  "scroll-px",
  "scroll-py",
  "space-x",
  "space-y",
  "translate-x",
  "translate-y",
  "inset-x",
  "inset-y",
  "gap-x",
  "gap-y",
  "min-w",
  "min-h",
  "max-w",
  "max-h",
  "inset",
  "basis",
  "size",
  "gap",
  "top",
  "bottom",
  "left",
  "right",
  "start",
  "end",
  "px",
  "py",
  "pt",
  "pb",
  "pl",
  "pr",
  "ps",
  "pe",
  "p",
  "mx",
  "my",
  "mt",
  "mb",
  "ml",
  "mr",
  "ms",
  "me",
  "m",
  "w",
  "h",
];

/** Sizing utilities also take Tailwind's fractions (`w-1/4`), which are not spacing. */
const TAKES_FRACTIONS =
  /^(w|h|size|min-w|min-h|max-w|max-h|basis|inset|top|bottom|left|right|start|end|translate)/;

/**
 * A spacing class with a numeric or arbitrary value (`gap-5`, `py-0.5`,
 * `-mt-2`, `h-[3px]`), after a class separator or a variant (`active:`).
 */
const CLASS = new RegExp(
  `(?<=^|[\\s"'\`:{(])-?(${SPACING_UTILITIES.join("|")})-(\\d+(?:\\.\\d+)?(?:/\\d+)?|\\[[^\\]]*\\])(?![\\w./-])`,
  "gm",
);

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
        "ctl-lg",
        "touch",
        "row",
        "page",
        "dock",
      ].toSorted(),
    );
  });

  // NativeWind drops a class it cannot compile without a warning, so an off-scale
  // step would lay out as if it were not there.
  it("is the only spacing the app's classes use", () => {
    const offScale = sources(SRC).flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(CLASS)]
        .filter(([, utility = "", value = ""]) =>
          value.includes("/")
            ? !TAKES_FRACTIONS.test(utility)
            : !ALLOWED.has(value),
        )
        .map(([match]) => `${path.relative(SRC, file)}: ${match}`),
    );
    expect(offScale).toEqual([]);
  });
});
