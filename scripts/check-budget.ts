/**
 * Build-time performance budget for the web app's initial JavaScript.
 *
 * `apps/web/.next/diagnostics/route-bundle-stats.json` lists, for every route,
 * the JS chunks the browser fetches before the page can hydrate. Each chunk is
 * gzipped (level 9) and the per-route total is checked against the ceiling for
 * its route class. The app uses Partial Prerendering, so the
 * `.next/server/app/**\/*.html` shells are empty or partial and are NOT the
 * source. The legacy `noModule` polyfill (build-manifest `polyfillFiles`) is
 * excluded.
 *
 * Fonts come from the `link` header of each route's `.meta` file: at most
 * `maxFontPreloads` `rel=preload; as=font` entries and `maxFontPreloadKB` of
 * their gzipped size per route.
 *
 * Ceilings and hard caps were re-measured on 2026-10-27 at 3b0f314e
 * (`SKIP_ENV_VALIDATION=true bun run build --filter=@infinitunes/web && bun run
 * budget`) and set to about 5% above the largest route of each class (measured
 * gzipped KB: catalog 332.9, detail 364.3, search 348.0, account 349.8, auth
 * 323.8, modal 324.1, not-found 234.3; fonts 2 preloads / 92.6KB). To raise one,
 * rebuild, re-measure, and set it to about 5% above the new maximum in the same
 * change as the code that grew it. A config may lower a ceiling but never raise
 * one past the hard caps.
 *
 * Routes whose class is not recognised are reported as UNCHECKED, not failed.
 *
 * Chunks every route loads (the framework share) are scanned for strings that
 * must never reach the shell (`forbiddenStrings`). In `warn` mode a match is
 * printed; in `error` mode it fails the check.
 *
 *   bun run build && bun run budget
 */
// --- Config ------------------------------------------------------------

export type RouteClass =
  | "catalog"
  | "detail"
  | "search"
  | "account"
  | "auth"
  | "modal"
  | "not-found";

export type Category = RouteClass | "unknown";

export type BudgetConfig = {
  /** Initial JS ceiling per route class, KB gzipped. */
  ceilingsKB: Record<RouteClass, number>;
  maxFontPreloads: number;
  maxFontPreloadKB: number;
  /** Substrings that must not appear in a chunk every route loads. */
  forbiddenStrings: string[];
  forbiddenMode: "warn" | "error";
};

/** Ratchet values: measured today rounded up, with headroom. */
export const defaultConfig: BudgetConfig = {
  ceilingsKB: {
    catalog: 350,
    detail: 383,
    search: 366,
    account: 368,
    auth: 341,
    modal: 341,
    "not-found": 247,
  },
  maxFontPreloads: 2,
  maxFontPreloadKB: 100,
  forbiddenStrings: ["ZodError", "navigator.credentials"],
  forbiddenMode: "error",
};

/** Hard caps: a config can never exceed these, whatever is measured. */
const HARD_CAPS_KB: Record<RouteClass, number> = {
  catalog: 350,
  detail: 383,
  search: 366,
  account: 368,
  auth: 341,
  modal: 341,
  "not-found": 247,
};
const HARD_MAX_FONT_PRELOADS = 2;
const HARD_MAX_FONT_PRELOAD_KB = 100;

const CATALOG_ROUTES = new Set([
  "/",
  "/browse",
  "/album",
  "/playlist",
  "/chart",
  "/radio",
  "/show",
  "/artist",
  "/search",
  "/privacy",
  "/terms",
  "/song",
  "/label",
  "/mix",
  "/episode",
]);
const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);
const NOT_FOUND_ROUTES = new Set([
  "/_not-found",
  "/[...catchAll]",
  "/_global-error",
]);

function assertWithinCaps(config: BudgetConfig): void {
  for (const cls of Object.keys(HARD_CAPS_KB) as RouteClass[]) {
    const kb = config.ceilingsKB[cls];
    if (kb > HARD_CAPS_KB[cls]) {
      throw new Error(
        `Budget config error: ${cls} ceiling ${kb}KB exceeds the ${HARD_CAPS_KB[cls]}KB cap.`,
      );
    }
  }
  if (config.maxFontPreloads > HARD_MAX_FONT_PRELOADS) {
    throw new Error(
      `Budget config error: ${config.maxFontPreloads} font preloads exceeds the ${HARD_MAX_FONT_PRELOADS} cap.`,
    );
  }
  if (config.maxFontPreloadKB > HARD_MAX_FONT_PRELOAD_KB) {
    throw new Error(
      `Budget config error: ${config.maxFontPreloadKB}KB of fonts exceeds the ${HARD_MAX_FONT_PRELOAD_KB}KB cap.`,
    );
  }
}

// --- Types ---------------------------------------------------------------

/** One entry of `route-bundle-stats.json`. */
export type RouteStat = {
  route: string;
  firstLoadUncompressedJsBytes: number;
  firstLoadChunkPaths: string[];
};

/** Reads the build output. The real implementation lives in {@link bunFileSystem}. */
export type FileSystemAdapter = {
  /** Every route's initial chunks, from route-bundle-stats.json. */
  readRouteStats(): RouteStat[] | Promise<RouteStat[]>;
  /** Chunks that are only loaded as `noModule` polyfills (build-manifest `polyfillFiles`). */
  polyfillFiles(): string[] | Promise<string[]>;
  /** The `href` of every `rel=preload; as=font` link the route's `.meta` file sends. */
  fontPreloadHrefs(route: string): string[] | Promise<string[]>;
  /** Gzip (level 9) size in bytes of a file, by its path relative to `.next`. */
  gzipSizeOf(file: string): number | Promise<number>;
  /** Contents of a file, by its path relative to `.next`. */
  readText(file: string): string | Promise<string>;
};

export type RouteRow = {
  route: string;
  category: Category;
  totalKB: number;
  pageSpecificKB: number;
  fontPreloads: number;
  fontKB: number;
  ceilingKB: number | null;
  status: "OK" | "FAIL" | "UNCHECKED";
  reasons: string[];
};

export type ForbiddenHit = {
  chunk: string;
  needle: string;
};

export type BudgetReport = {
  rows: RouteRow[];
  frameworkKB: number;
  frameworkChunks: string[];
  forbiddenHits: ForbiddenHit[];
  forbiddenMode: BudgetConfig["forbiddenMode"];
  ok: boolean;
};

// --- Pure logic ------------------------------------------------------------

/**
 * Maps a chunk or font path to one relative to `.next`. route-bundle-stats
 * records chunks as `.next/static/...` (relative to apps/web), the manifests
 * as `static/...`, and fonts as `/_next/static/...` URLs.
 */
export function toNextRelative(path: string): string {
  return path
    .replace(/^\.\//, "")
    .replace(/^\/?\.next\//, "")
    .replace(/^\/?_next\//, "");
}

/**
 * Classifies a route by its path. `/settings*` and `/me*` match whole
 * segments (`/melody` is not `/me*`). A route with `[token]` or `[id]` is a
 * detail page unless an earlier class claims it, so `/me/playlist/[id]` is
 * an account page.
 */
export function classifyRoute(route: string): Category {
  if (CATALOG_ROUTES.has(route)) return "catalog";
  if (route === "/search/[type]/[query]") return "search";
  if (
    route === "/settings" ||
    route.startsWith("/settings/") ||
    route === "/me" ||
    route.startsWith("/me/")
  ) {
    return "account";
  }
  if (AUTH_ROUTES.has(route)) return "auth";
  if (/^\/\(\.+\)/.test(route)) return "modal";
  if (NOT_FOUND_ROUTES.has(route)) return "not-found";
  if (route.includes("[token]") || route.includes("[id]")) return "detail";
  return "unknown";
}

/**
 * Extracts the hrefs of `rel=preload; as=font` entries from a `link` header,
 * e.g. `</_next/static/media/a.woff2>; rel=preload; as="font"; crossorigin="",
 * </_next/static/chunks/a.css>; rel=preload; as="style"`.
 */
export function fontPreloadHrefsFromLink(linkHeader: string): string[] {
  return [...linkHeader.matchAll(/<([^>]+)>([^<]*)/g)].flatMap((match) => {
    const href = match[1];
    if (!href) return [];
    const params = (match[2] ?? "")
      .replace(/,\s*$/, "")
      .split(";")
      .map((param) => param.trim());
    const isPreload = params.includes("rel=preload");
    const isFont = params.includes('as="font"') || params.includes("as=font");
    return isPreload && isFont ? [href] : [];
  });
}

/**
 * Evaluates the performance budget against a build's output.
 * Pure over the adapter: same adapter answers in, same report out.
 */
export async function evaluateBudget(
  fs: FileSystemAdapter,
  config: BudgetConfig = defaultConfig,
): Promise<BudgetReport> {
  assertWithinCaps(config);

  const stats = await fs.readRouteStats();
  if (stats.length === 0) {
    throw new Error(
      "route-bundle-stats.json lists no routes. Rebuild the app.",
    );
  }

  const polyfills = new Set((await fs.polyfillFiles()).map(toNextRelative));
  const routes = stats
    .map((stat) => ({
      route: stat.route,
      chunks: [...new Set(stat.firstLoadChunkPaths.map(toNextRelative))].filter(
        (chunk) => !polyfills.has(chunk),
      ),
    }))
    .sort((a, b) => a.route.localeCompare(b.route));

  // The framework share is whatever every route loads in common.
  const frameworkChunks = routes.reduce<string[]>(
    (shared, { chunks }, index) =>
      index === 0 ? chunks : shared.filter((chunk) => chunks.includes(chunk)),
    [],
  );
  const frameworkSet = new Set(frameworkChunks);

  const sizeCache = new Map<string, number>();
  const gzipKB = async (file: string): Promise<number> => {
    let bytes = sizeCache.get(file);
    if (bytes === undefined) {
      bytes = await fs.gzipSizeOf(file);
      sizeCache.set(file, bytes);
    }
    return bytes / 1024;
  };
  const sumKB = async (files: string[]): Promise<number> => {
    let total = 0;
    for (const file of files) total += await gzipKB(file);
    return total;
  };

  const frameworkKB = await sumKB(frameworkChunks);

  const rows: RouteRow[] = [];
  for (const { route, chunks } of routes) {
    const fonts = (await fs.fontPreloadHrefs(route)).map(toNextRelative);
    const category = classifyRoute(route);
    const ceilingKB =
      category === "unknown" ? null : config.ceilingsKB[category];
    const totalKB = await sumKB(chunks);
    const pageSpecificKB = await sumKB(
      chunks.filter((chunk) => !frameworkSet.has(chunk)),
    );
    const fontKB = await sumKB(fonts);

    const reasons: string[] = [];
    if (ceilingKB !== null && totalKB > ceilingKB) {
      reasons.push(
        `${totalKB.toFixed(1)}KB exceeds the ${ceilingKB}KB ceiling`,
      );
    }
    if (fonts.length > config.maxFontPreloads) {
      reasons.push(
        `${fonts.length} font preloads exceeds the ${config.maxFontPreloads} limit`,
      );
    }
    if (fontKB > config.maxFontPreloadKB) {
      reasons.push(
        `${fontKB.toFixed(1)}KB of preloaded fonts exceeds the ${config.maxFontPreloadKB}KB limit`,
      );
    }

    rows.push({
      route,
      category,
      totalKB,
      pageSpecificKB,
      fontPreloads: fonts.length,
      fontKB,
      ceilingKB,
      status:
        category === "unknown"
          ? "UNCHECKED"
          : reasons.length > 0
            ? "FAIL"
            : "OK",
      reasons,
    });
  }

  const forbiddenHits: ForbiddenHit[] = [];
  for (const chunk of frameworkChunks) {
    const text = await fs.readText(chunk);
    for (const needle of config.forbiddenStrings) {
      if (text.includes(needle)) forbiddenHits.push({ chunk, needle });
    }
  }

  const rowsOk = rows.every((row) => row.status !== "FAIL");
  const forbiddenOk =
    config.forbiddenMode === "warn" || forbiddenHits.length === 0;

  return {
    rows,
    frameworkKB,
    frameworkChunks: [...frameworkChunks].sort(),
    forbiddenHits,
    forbiddenMode: config.forbiddenMode,
    ok: rowsOk && forbiddenOk,
  };
}

// --- Reporting -------------------------------------------------------------

export function formatReport(report: BudgetReport): string {
  const header = [
    "Route",
    "Class",
    "Total KB",
    "Page KB",
    "Ceiling KB",
    "Fonts",
    "Font KB",
    "Status",
  ];
  const lines = report.rows.map((row) => [
    row.route,
    row.category,
    row.totalKB.toFixed(1),
    row.pageSpecificKB.toFixed(1),
    row.ceilingKB === null ? "-" : String(row.ceilingKB),
    String(row.fontPreloads),
    row.fontKB.toFixed(1),
    row.status,
  ]);
  const widths = header.map((title, i) =>
    Math.max(title.length, ...lines.map((line) => line[i]?.length ?? 0)),
  );
  const pad = (cell: string, i: number) => cell.padEnd(widths[i] ?? 0);
  const rule = widths.map((w) => "-".repeat(w)).join("-+-");

  const table = [
    header.map(pad).join(" | "),
    rule,
    ...lines.map((line) => line.map(pad).join(" | ")),
  ].join("\n");

  const forbidden = report.forbiddenHits.length
    ? `\n\nForbidden in shared chunks (${report.forbiddenMode}):\n` +
      report.forbiddenHits
        .map((hit) => `  ${hit.chunk} contains "${hit.needle}"`)
        .join("\n")
    : "";

  const failures = report.rows.filter((row) => row.status === "FAIL");
  const details = failures.length
    ? "\n\nViolations:\n" +
      failures
        .map((row) => `  ${row.route}: ${row.reasons.join("; ")}`)
        .join("\n")
    : "";

  return (
    table +
    `\n\nFramework share (shared by every route): ${report.frameworkKB.toFixed(1)}KB gzipped` +
    forbidden +
    details
  );
}

// --- Real adapter ------------------------------------------------------------

/** `apps/web/.next`, resolved from this script's location (repo `scripts/`). */
export const DEFAULT_NEXT_DIR = `${import.meta.dir}/../apps/web/.next`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRouteStats(value: unknown): RouteStat[] {
  if (!Array.isArray(value)) {
    throw new Error("route-bundle-stats.json is not an array.");
  }
  return value.map((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.route !== "string" ||
      typeof entry.firstLoadUncompressedJsBytes !== "number" ||
      !Array.isArray(entry.firstLoadChunkPaths) ||
      !entry.firstLoadChunkPaths.every((p) => typeof p === "string")
    ) {
      throw new Error(
        "route-bundle-stats.json has an entry without route, firstLoadUncompressedJsBytes and firstLoadChunkPaths.",
      );
    }
    return {
      route: entry.route,
      firstLoadUncompressedJsBytes: entry.firstLoadUncompressedJsBytes,
      firstLoadChunkPaths: entry.firstLoadChunkPaths,
    };
  });
}

export function bunFileSystem(nextDir = DEFAULT_NEXT_DIR): FileSystemAdapter {
  const existing = async (file: string): Promise<string> => {
    const full = `${nextDir}/${file}`;
    if (!(await Bun.file(full).exists())) {
      throw new Error(
        `Missing build output ${file} under ${nextDir}. Run \`next build\` in apps/web first.`,
      );
    }
    return full;
  };
  const readJson = async (file: string): Promise<unknown> =>
    Bun.file(await existing(file)).json();

  return {
    async readRouteStats(): Promise<RouteStat[]> {
      return parseRouteStats(
        await readJson("diagnostics/route-bundle-stats.json"),
      );
    },
    async polyfillFiles(): Promise<string[]> {
      // Optional: without a build manifest nothing is treated as a polyfill.
      if (!(await Bun.file(`${nextDir}/build-manifest.json`).exists())) {
        return [];
      }
      const manifest = await readJson("build-manifest.json");
      if (!isRecord(manifest) || !Array.isArray(manifest.polyfillFiles)) {
        return [];
      }
      return manifest.polyfillFiles.filter(
        (file): file is string => typeof file === "string",
      );
    },
    async fontPreloadHrefs(route: string): Promise<string[]> {
      // Pages with no `.meta` file (never prerendered) preload nothing.
      const metaFile = `server/app/${route === "/" ? "index" : route.slice(1)}.meta`;
      if (!(await Bun.file(`${nextDir}/${metaFile}`).exists())) return [];
      const meta = await readJson(metaFile);
      const headers =
        isRecord(meta) && isRecord(meta.headers) ? meta.headers : {};
      const link = headers.link;
      const linkHeader = Array.isArray(link)
        ? link.join(", ")
        : typeof link === "string"
          ? link
          : "";
      return fontPreloadHrefsFromLink(linkHeader);
    },
    async gzipSizeOf(file: string): Promise<number> {
      // Chunk names are content-hashed, so a missing file means the stats
      // drifted from the build, not a transient issue.
      const bytes = await Bun.file(await existing(file)).bytes();
      return Bun.gzipSync(bytes, { level: 9 }).byteLength;
    },
    async readText(file: string): Promise<string> {
      return Bun.file(await existing(file)).text();
    },
  };
}

// --- CLI ---------------------------------------------------------------

if (import.meta.main) {
  try {
    const report = await evaluateBudget(bunFileSystem());
    console.log(formatReport(report));
    if (!report.ok) {
      console.error("\nPerformance budget check failed.");
      process.exit(1);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
