import { expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

it("keeps TanStack Query outside the player's static dependency graph", async () => {
  const web = resolve(import.meta.dir, "..");
  const pending = [resolve(web, "components/player.tsx")];
  const seen = new Set<string>();
  const imports = new Set<string>();
  const parser = new Bun.Transpiler({ loader: "tsx" });
  while (pending.length) {
    const file = pending.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = await Bun.file(file).text();
    for (const entry of parser.scanImports(source)) {
      if (entry.kind !== "import-statement") continue;
      imports.add(entry.path);
      const base = entry.path.startsWith("~/")
        ? resolve(web, entry.path.slice(2))
        : entry.path.startsWith(".")
          ? resolve(dirname(file), entry.path)
          : null;
      if (!base) continue;
      const target = [
        base + ".tsx",
        base + ".ts",
        resolve(base, "index.tsx"),
        resolve(base, "index.ts"),
      ].find(existsSync);
      if (target) pending.push(target);
    }
  }
  expect(imports.has("@tanstack/react-query")).toBe(false);
});
