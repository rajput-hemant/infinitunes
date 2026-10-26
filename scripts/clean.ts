// Removes build/cache output only, from an explicit allow-list. Never touches .env*, .claude/, .lavish/,
// apps/mobile/{ios,android} (use `clean:native`) or anything tracked. `--native` removes only those two.
import { $ } from "bun";

const root = `${import.meta.dir}/..`;
const native = Bun.argv.includes("--native");

const DIR_NAMES = new Set(["node_modules", ".turbo", "dist", "coverage"]);
const EXTRA_DIRS = ["apps/web/.next", "apps/mobile/.expo"];
const NATIVE_DIRS = ["apps/mobile/ios", "apps/mobile/android"];
const SKIP = new Set([".git", ".claude", ".lavish"]);

const targets: string[] = [];

/** Entry names of one directory, and which of them are real directories (symlinks are neither). */
async function entriesOf(dir: string) {
  const names: string[] = [];
  for await (const name of new Bun.Glob("*").scan({
    cwd: dir,
    dot: true,
    onlyFiles: false,
  })) {
    names.push(name);
  }
  const dirs = new Set<string>();
  for await (const name of new Bun.Glob("*/").scan({
    cwd: dir,
    dot: true,
    onlyFiles: false,
  })) {
    dirs.add(name);
  }
  return { names, dirs };
}

async function walk(dir: string) {
  const { names, dirs } = await entriesOf(dir);
  for (const name of names) {
    const path = `${dir}/${name}`;
    if (dirs.has(name)) {
      if (DIR_NAMES.has(name)) targets.push(path);
      else if (!SKIP.has(name)) await walk(path);
    } else if (name.endsWith(".tsbuildinfo")) targets.push(path);
  }
}

if (native) {
  for (const p of NATIVE_DIRS) targets.push(`${root}/${p}`);
} else {
  await walk(root); // does not descend into matched dirs (node_modules etc.)
  for (const p of EXTRA_DIRS) targets.push(`${root}/${p}`);
}

let removed = 0;
for (const path of targets) {
  if (
    !(await Bun.file(path)
      .stat()
      .then(
        () => true,
        () => false,
      ))
  )
    continue;
  await $`rm -rf ${path}`;
  console.log(`removed ${path.slice(root.length + 1)}`);
  removed++;
}
console.log(
  `clean done: ${removed} removed${native ? "" : "; run bun install"}`,
);
