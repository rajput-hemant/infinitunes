import { describe, expect, it } from "bun:test";

import {
  classifyRoute,
  evaluateBudget,
  fontPreloadHrefsFromLink,
  formatReport,
  toNextRelative,
  type BudgetConfig,
  type FileSystemAdapter,
  type RouteStat,
} from "../check-budget";

const config: BudgetConfig = {
  ceilingsKB: {
    catalog: 100,
    detail: 90,
    search: 90,
    account: 90,
    auth: 80,
    modal: 80,
    "not-found": 70,
  },
  maxFontPreloads: 4,
  maxFontPreloadKB: 250,
  forbiddenStrings: ["ZodError"],
  forbiddenMode: "warn",
};

type FakeOptions = {
  /** Route to chunk paths, written the way route-bundle-stats.json writes them. */
  routes: Record<string, string[]>;
  /** Gzipped sizes in KB, keyed by path relative to `.next`. */
  sizesKB: Record<string, number>;
  fonts?: Record<string, string[]>;
  polyfills?: string[];
  texts?: Record<string, string>;
};

/** A fake adapter over the route-bundle-stats shape. */
function fakeFileSystem(options: FakeOptions): FileSystemAdapter {
  const stats: RouteStat[] = Object.entries(options.routes).map(
    ([route, chunks]) => ({
      route,
      firstLoadUncompressedJsBytes: 0,
      firstLoadChunkPaths: chunks,
    }),
  );
  return {
    readRouteStats: () => stats,
    polyfillFiles: () => options.polyfills ?? [],
    fontPreloadHrefs: (route) => options.fonts?.[route] ?? [],
    gzipSizeOf: (file) => {
      const kb = options.sizesKB[file];
      if (kb === undefined) throw new Error(`no fixture size for ${file}`);
      return kb * 1024;
    },
    readText: (file) => options.texts?.[file] ?? "",
  };
}

const FW = ".next/static/chunks/fw.js";

describe("evaluateBudget", () => {
  it("passes routes under their class ceiling and reports the shared framework share", () => {
    const fs = fakeFileSystem({
      routes: {
        "/": [FW, ".next/static/chunks/home.js"],
        "/browse": [FW, ".next/static/chunks/browse.js"],
      },
      sizesKB: {
        "static/chunks/fw.js": 50,
        "static/chunks/home.js": 10,
        "static/chunks/browse.js": 5,
      },
    });

    const report = evaluateBudget(fs, config);
    expect(report.ok).toBe(true);
    expect(report.frameworkKB).toBeCloseTo(50);
    expect(report.frameworkChunks).toEqual(["static/chunks/fw.js"]);

    const home = report.rows.find((row) => row.route === "/");
    expect(home?.category).toBe("catalog");
    expect(home?.totalKB).toBeCloseTo(60);
    expect(home?.pageSpecificKB).toBeCloseTo(10);
    expect(home?.status).toBe("OK");
  });

  it("fails a route over its class ceiling and names the route", () => {
    const fs = fakeFileSystem({
      routes: { "/album/[name]/[token]": [".next/static/chunks/big.js"] },
      sizesKB: { "static/chunks/big.js": 95 },
    });

    const report = evaluateBudget(fs, config);
    expect(report.ok).toBe(false);
    expect(report.rows[0]?.category).toBe("detail");
    expect(report.rows[0]?.status).toBe("FAIL");
    expect(report.rows[0]?.reasons[0]).toContain("exceeds the 90KB ceiling");
  });

  it("drops the noModule polyfill from every route", () => {
    const fs = fakeFileSystem({
      routes: {
        "/": [".next/static/chunks/a.js", ".next/static/chunks/polyfill.js"],
      },
      sizesKB: {
        "static/chunks/a.js": 5,
        "static/chunks/polyfill.js": 999,
      },
      polyfills: ["static/chunks/polyfill.js"],
    });

    const report = evaluateBudget(fs, config);
    expect(report.rows[0]?.totalKB).toBeCloseTo(5);
    expect(report.ok).toBe(true);
  });

  it("fails a route with too many font preloads", () => {
    const fonts = Array.from(
      { length: 5 },
      (_, i) => `/_next/static/media/${i}.woff2`,
    );
    const fs = fakeFileSystem({
      routes: { "/": [] },
      sizesKB: Object.fromEntries(
        fonts.map((href) => [href.replace("/_next/", ""), 1]),
      ),
      fonts: { "/": fonts },
    });

    const report = evaluateBudget(fs, config);
    expect(report.ok).toBe(false);
    expect(report.rows[0]?.reasons[0]).toContain("5 font preloads");
  });

  it("fails a route whose preloaded fonts are too heavy", () => {
    const fs = fakeFileSystem({
      routes: { "/": [] },
      sizesKB: { "static/media/a.woff2": 260 },
      fonts: { "/": ["/_next/static/media/a.woff2"] },
    });

    const report = evaluateBudget(fs, config);
    expect(report.ok).toBe(false);
    expect(report.rows[0]?.fontKB).toBeCloseTo(260);
    expect(report.rows[0]?.reasons[0]).toContain("of preloaded fonts");
  });

  it("reports an unrecognised route as unchecked rather than failing", () => {
    const fs = fakeFileSystem({
      routes: { "/surprise": [".next/static/chunks/big.js"] },
      sizesKB: { "static/chunks/big.js": 500 },
    });

    const report = evaluateBudget(fs, config);
    expect(report.rows[0]?.status).toBe("UNCHECKED");
    expect(report.rows[0]?.ceilingKB).toBeNull();
    expect(report.ok).toBe(true);
  });

  it("warns on a forbidden string in a shared chunk without failing in warn mode", () => {
    const fs = fakeFileSystem({
      routes: { "/": [FW], "/browse": [FW] },
      sizesKB: { "static/chunks/fw.js": 10 },
      texts: { "static/chunks/fw.js": "throw new ZodError()" },
    });

    const report = evaluateBudget(fs, config);
    expect(report.ok).toBe(true);
    expect(report.forbiddenHits).toEqual([
      { chunk: "static/chunks/fw.js", needle: "ZodError" },
    ]);
    expect(formatReport(report)).toContain(
      'static/chunks/fw.js contains "ZodError"',
    );
  });

  it("fails on a forbidden string in a shared chunk once the mode is error", () => {
    const fs = fakeFileSystem({
      routes: { "/": [FW], "/browse": [FW] },
      sizesKB: { "static/chunks/fw.js": 10 },
      texts: { "static/chunks/fw.js": "throw new ZodError()" },
    });

    const report = evaluateBudget(fs, { ...config, forbiddenMode: "error" });
    expect(report.ok).toBe(false);
  });

  it("ignores forbidden strings in chunks that only some routes load", () => {
    const fs = fakeFileSystem({
      routes: { "/": [FW], "/login": [FW, ".next/static/chunks/auth.js"] },
      sizesKB: { "static/chunks/fw.js": 10, "static/chunks/auth.js": 5 },
      texts: { "static/chunks/auth.js": "ZodError" },
    });

    const report = evaluateBudget(fs, { ...config, forbiddenMode: "error" });
    expect(report.forbiddenHits).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("refuses a config that raises a ceiling above the hard cap", () => {
    const fs = fakeFileSystem({
      routes: { "/": [] },
      sizesKB: {},
    });

    expect(() =>
      evaluateBudget(fs, {
        ...config,
        ceilingsKB: { ...config.ceilingsKB, catalog: 541 },
      }),
    ).toThrow("catalog ceiling 541KB exceeds the 540KB cap");
  });
});

describe("classifyRoute", () => {
  it("maps each route family to its class", () => {
    expect(classifyRoute("/")).toBe("catalog");
    expect(classifyRoute("/browse")).toBe("catalog");
    expect(classifyRoute("/album/[name]/[token]")).toBe("detail");
    expect(classifyRoute("/show/[name]/[season]/[token]")).toBe("detail");
    expect(classifyRoute("/search/[type]/[query]")).toBe("search");
    expect(classifyRoute("/settings/appearance")).toBe("account");
    expect(classifyRoute("/me/playlist/[id]")).toBe("account");
    expect(classifyRoute("/login")).toBe("auth");
    expect(classifyRoute("/(.)login")).toBe("modal");
    expect(classifyRoute("/[...catchAll]")).toBe("not-found");
  });

  it("matches account routes by whole segment only", () => {
    expect(classifyRoute("/melody")).toBe("unknown");
    expect(classifyRoute("/settingsx")).toBe("unknown");
  });
});

describe("parsing helpers", () => {
  it("normalises chunk and font paths to be relative to .next", () => {
    expect(toNextRelative(".next/static/chunks/a.js")).toBe(
      "static/chunks/a.js",
    );
    expect(toNextRelative("/_next/static/media/a.woff2")).toBe(
      "static/media/a.woff2",
    );
    expect(toNextRelative("static/chunks/a.js")).toBe("static/chunks/a.js");
  });

  it("keeps only rel=preload as=font entries from a link header", () => {
    const link =
      '</_next/static/media/a.woff2>; rel=preload; as="font"; crossorigin=""; type="font/woff2", ' +
      '</_next/static/chunks/s.css>; rel=preload; as="style", ' +
      '</_next/static/media/b.woff>; rel=preload; as="font"; crossorigin=""';
    expect(fontPreloadHrefsFromLink(link)).toEqual([
      "/_next/static/media/a.woff2",
      "/_next/static/media/b.woff",
    ]);
  });
});

describe("formatReport", () => {
  it("renders a table with the framework share and lists violations", () => {
    const fs = fakeFileSystem({
      routes: { "/": [".next/static/chunks/big.js"] },
      sizesKB: { "static/chunks/big.js": 500 },
    });
    const output = formatReport(evaluateBudget(fs, config));
    expect(output).toContain("Route");
    expect(output).toContain("Framework share");
    expect(output).toContain("Violations:");
  });
});
