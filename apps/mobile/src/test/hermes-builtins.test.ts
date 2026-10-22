import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/** Bundled sources: the app and the shared packages Metro compiles into it. */
const ROOTS = [
  "..",
  "../../../../packages/core/src",
  "../../../../packages/types/src",
].map((dir) => path.resolve(__dirname, dir));

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(file);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [file]
      : [];
  });
}

// Hermes on the app's builds lacks ES2023's copying array methods: calling one
// throws "undefined is not a function" at runtime while Jest (Node) passes.
const MISSING = /\.(toSorted|toReversed|toSpliced)\(/;

it("uses no array method Hermes lacks", () => {
  const offenders = ROOTS.flatMap(sources).filter((file) =>
    MISSING.test(readFileSync(file, "utf8")),
  );
  expect(offenders).toEqual([]);
});
