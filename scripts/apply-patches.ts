/**
 * Applies `patches/*.patch` after `bun install`. Bun's `patchedDependencies` fails here
 * ("failed applying patch file: ENOENT") with the isolated linker's peer-variant dirs, so each
 * patch (`<name>@<version>.patch`, paths `a/node_modules/<name>/...`) is applied by hand to every
 * `node_modules/.bun/<name>@<version>+*` copy. Idempotent.
 */
const root = `${import.meta.dir}/..`;
const store = `${root}/node_modules/.bun`;

/** Whether a path exists (following symlinks, as existsSync did). Bun.file().exists() is false for directories. */
async function exists(path: string): Promise<boolean> {
  return Bun.file(path)
    .stat()
    .then(
      () => true,
      () => false,
    );
}

async function listNames(cwd: string, pattern = "*"): Promise<string[]> {
  const names: string[] = [];
  for await (const name of new Bun.Glob(pattern).scan({
    cwd,
    dot: true,
    onlyFiles: false,
  })) {
    names.push(name);
  }
  return names;
}

for (const file of (await listNames(`${root}/patches`, "*.patch")).filter((f) =>
  f.endsWith(".patch"),
)) {
  const key = file.slice(0, -".patch".length);
  const name = key.slice(0, key.lastIndexOf("@"));
  const patch = `${root}/patches/${file}`;
  for (const dir of (await listNames(store)).filter(
    (d) => d === key || d.startsWith(`${key}+`),
  )) {
    const target = `${store}/${dir}/node_modules/${name}`;
    if (!(await exists(target))) continue;
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
