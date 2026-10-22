import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import resolveConfig from "tailwindcss/resolveConfig";

import tailwindConfig from "../../tailwind.config";
import { radii } from "./tokens";

const SRC = path.resolve(__dirname, "..");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "test" ? [] : sources(file);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [file]
      : [];
  });
}

const RADIUS = resolveConfig(tailwindConfig).theme.borderRadius as Record<
  string,
  string
>;

describe("corner classes", () => {
  it("compile rounded-full to a plain capsule radius, never a variable", () => {
    // NativeWind turns 9999px into `borderRadius: 9999` on both platforms;
    // only the `radii` steps are runtime variables (the corner style).
    expect(RADIUS.full).toBe("9999px");
    for (const name of Object.keys(radii)) {
      expect(RADIUS[name]).toBe(`var(--radius-${name})`);
    }
  });

  it("use only radii that exist", () => {
    const unknown = sources(SRC).flatMap((file) =>
      [
        ...readFileSync(file, "utf8")
          // Prose ("a rounded-square button") is not a class.
          .replace(/^\s*(\/\/|\*|\/\*).*$/gm, "")
          .matchAll(
            /(?<![\w-])rounded(?:-[trblse]{1,2})?-([a-z0-9]+)(?![\w-])/g,
          ),
      ]
        .map((match) => match[1])
        .filter((name) => name !== undefined && !(name in RADIUS))
        .map((name) => `${path.relative(SRC, file)}: rounded-${name}`),
    );
    expect(unknown).toEqual([]);
  });
});
