/**
 * What the mobile app's release JavaScript is made of, per package.
 *
 * Exports a production Android bundle (Hermes bytecode plus its source map)
 * into a scratch directory, then sums each package's original source from
 * the map. Source bytes are a proxy (comments and types included), good for
 * comparing packages and runs, not for the bytecode size itself, which is
 * printed separately.
 *
 *   bun run mobile:bundle-report            # export, then report
 *   bun run mobile:bundle-report <out-dir>  # report an existing export
 *
 * Baseline, 2026-10-29 at 05841e4d: 6.07 MB `.hbc`, 2788 source files. Largest:
 * react-native 2199 KB, expo-router 1324, react-native-reanimated 833, zod
 * 807 (v4 core 410 and every locale 313, both kept by `zod/mini` too, since
 * Metro does not tree-shake), react-native-gesture-handler 465, app source 720,
 * @material/material-color-utilities 318, react-native-svg 271.
 * `EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1 EXPO_UNSTABLE_TREE_SHAKING=1` gave
 * 5.76 MB (-5%); it is a build-environment flag, not set here.
 */
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "bun";

const mobile = `${import.meta.dir}/../apps/mobile`;

type SourceMap = { sources: string[]; sourcesContent?: (string | null)[] };

/** `react-native`, `@expo/ui`, `app:features`, `pkg:core`... */
export function packageOf(source: string): string {
  const nodeModule = source.match(
    /node_modules\/(?:\.bun\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/,
  );
  if (nodeModule?.[1]) return nodeModule[1];
  const app = source.match(/apps\/mobile\/src\/([^/]+)/);
  if (app?.[1]) return `app:${app[1]}`;
  const workspace = source.match(/packages\/([^/]+)/);
  return workspace?.[1] ? `pkg:${workspace[1]}` : source;
}

function findFiles(dir: string, suffix: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((name) => name.endsWith(suffix))
    .map((name) => join(dir, name));
}

async function exportBundle(): Promise<string> {
  const out = mkdtempSync(join(tmpdir(), "mobile-bundle-"));
  await $`bunx expo export --platform android --output-dir ${out} --dump-sourcemap`
    .cwd(mobile)
    .env({
      ...process.env,
      EXPO_PUBLIC_API_URL:
        process.env.EXPO_PUBLIC_API_URL ?? "https://example.com",
    })
    .quiet();
  return out;
}

if (import.meta.main) {
  const out = Bun.argv[2] ?? (await exportBundle());
  const [bundle] = findFiles(out, ".hbc");
  const [mapFile] = findFiles(out, ".hbc.map");
  if (!bundle || !mapFile) throw new Error(`No .hbc export in ${out}`);

  const map = JSON.parse(readFileSync(mapFile, "utf8")) as SourceMap;
  const sizes = new Map<string, number>();
  map.sources.forEach((source, index) => {
    const name = packageOf(source);
    const bytes = map.sourcesContent?.[index]?.length ?? 0;
    sizes.set(name, (sizes.get(name) ?? 0) + bytes);
  });

  console.log(
    `${bundle}\n${(statSync(bundle).size / 1e6).toFixed(2)} MB bytecode, ${map.sources.length} source files\n`,
  );
  console.log("Source KB | Package");
  for (const [name, bytes] of [...sizes]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)) {
    console.log(`${(bytes / 1024).toFixed(0).padStart(9)} | ${name}`);
  }
}
