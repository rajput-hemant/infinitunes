// Removes build/cache output only, from an explicit allow-list. Never touches .env*, .claude/, .lavish/,
// apps/mobile/{ios,android} (use `clean:native`) or anything tracked. `--native` removes only those two.
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const native = process.argv.includes("--native");

const DIR_NAMES = new Set(["node_modules", ".turbo", "dist", "coverage"]);
const EXTRA_DIRS = ["apps/web/.next", "apps/mobile/.expo"];
const NATIVE_DIRS = ["apps/mobile/ios", "apps/mobile/android"];
const SKIP = new Set([".git", ".claude", ".lavish"]);

const targets: string[] = [];

function walk(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (DIR_NAMES.has(entry.name)) targets.push(path);
      else if (!SKIP.has(entry.name)) walk(path);
    } else if (entry.name.endsWith(".tsbuildinfo")) targets.push(path);
  }
}

if (native) {
  for (const p of NATIVE_DIRS) targets.push(join(root, p));
} else {
  walk(root); // does not descend into matched dirs (node_modules etc.)
  for (const p of EXTRA_DIRS) targets.push(join(root, p));
}

let removed = 0;
for (const path of targets) {
  try {
    statSync(path);
  } catch {
    continue;
  }
  rmSync(path, { recursive: true, force: true });
  console.log(`removed ${path.slice(root.length + 1)}`);
  removed++;
}
console.log(
  `clean done: ${removed} removed${native ? "" : "; run bun install"}`,
);
