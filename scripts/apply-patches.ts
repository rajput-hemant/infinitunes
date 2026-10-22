/**
 * Applies `patches/*.patch` after `bun install`. Bun's `patchedDependencies` fails here
 * ("failed applying patch file: ENOENT") with the isolated linker's peer-variant dirs, so each
 * patch (`<name>@<version>.patch`, paths `a/node_modules/<name>/...`) is applied by hand to every
 * `node_modules/.bun/<name>@<version>+*` copy. Idempotent.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const store = join(root, "node_modules/.bun");

for (const file of readdirSync(join(root, "patches")).filter((f) =>
  f.endsWith(".patch"),
)) {
  const key = file.slice(0, -".patch".length);
  const name = key.slice(0, key.lastIndexOf("@"));
  const patch = join(root, "patches", file);
  for (const dir of readdirSync(store).filter(
    (d) => d === key || d.startsWith(`${key}+`),
  )) {
    const target = join(store, dir, "node_modules", name);
    if (!existsSync(target)) continue;
    const git = (...args: string[]) =>
      Bun.spawnSync(
        [
          "git",
          "apply",
          "--unsafe-paths",
          "-p3",
          `--directory=${target}`,
          ...args,
          patch,
        ],
        {
          cwd: root,
        },
      );
    if (git("--reverse", "--check").exitCode === 0) continue; // already applied
    const applied = git();
    if (applied.exitCode !== 0)
      throw new Error(`${file} on ${dir}: ${applied.stderr}`);
    console.log(`patched ${dir}`);
  }
}
