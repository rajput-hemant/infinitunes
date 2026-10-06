import { Glob } from "bun";

// `mock.module` and the happy-dom global leak across every file in one bun
// process, so each file below gets its own process. Directories are discovered,
// so a new mocking test needs no list edit. The two router tests are listed in
// bunfig.toml `pathIgnorePatterns` too, to keep them out of the plain run.
const groups = {
  mocked: {
    cwd: "apps/web/tests/mocked",
    pattern: "*.test.{ts,tsx}",
    args: [],
  },
  dom: { cwd: "apps/web/tests/dom", pattern: "*.test.{ts,tsx}", args: [] },
  routers: {
    cwd: ".",
    pattern: "packages/trpc/tests/{history,user}-router.test.ts",
    args: ["--path-ignore-patterns="],
  },
} as const;

type GroupName = keyof typeof groups;

const requested = process.argv.slice(2);
const names = (requested.length ? requested : Object.keys(groups)) as string[];
const unknown = names.filter((name) => !(name in groups));
if (unknown.length) {
  console.error(
    `unknown group: ${unknown.join(", ")} (expected ${Object.keys(groups).join(", ")})`,
  );
  process.exit(2);
}

const failed: string[] = [];
let ran = 0;

for (const name of names as GroupName[]) {
  const { cwd, pattern, args } = groups[name];
  const files = [...new Glob(pattern).scanSync({ cwd })].sort();
  if (!files.length) {
    console.error(`no test files for group "${name}" (${cwd}/${pattern})`);
    process.exit(2);
  }
  for (const file of files) {
    console.log(`\n== ${cwd}/${file}`);
    const { exitCode } = Bun.spawnSync(
      [process.execPath, "test", ...args, `./${file}`],
      { cwd, stdout: "inherit", stderr: "inherit" },
    );
    ran++;
    if (exitCode !== 0) failed.push(`${cwd}/${file}`);
  }
}

console.log(`\nisolated: ${ran - failed.length}/${ran} files passed`);
if (failed.length) {
  console.error(`failed:\n${failed.map((f) => `  ${f}`).join("\n")}`);
  process.exit(1);
}
