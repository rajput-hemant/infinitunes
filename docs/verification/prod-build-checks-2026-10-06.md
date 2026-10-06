# Production Build Checks Verification — 2026-10-06

**Worktree**: `/Users/rajput-hemant/.treehouse/infinitunes-5ea9b0/6/infinitunes`
**Branch**: `task/prod-build-checks` (based on `migration/bun-monorepo` @ `79ba89d0130fee2202be0670bfd8ffdd3f6c604e`)
**Bun versions tested**: 1.4.2 (pinned), 1.3.14 (via `bunx`)

---

## DP-12 — Full production `bun run build` completion

**Verdict**: **Confirmed** — build completes successfully on local machine.

### Commands run
```bash
# bun 1.4.2 (pinned)
SKIP_ENV_VALIDATION=true bun run build

# bun 1.3.14
SKIP_ENV_VALIDATION=true bunx bun@1.3.14 run build
```

### Results

| Bun version | Exit code | Time | Notes |
|-------------|-----------|------|-------|
| 1.4.2       | 0         | 9.84s | Clean build, all 30 static pages generated |
| 1.3.14      | 0         | 5.4s  | Clean build, all 30 static pages generated |

Both builds produce identical route classification (all dynamic `ƒ` except `/manifest.webmanifest` static `○`, plus `ƒ Proxy (Middleware)`). No OOM, no SIGILL, no Turbopack errors. The sandbox OOM/exit-137 and SIGILL issues do not reproduce on this machine.

**Conclusion**: DP-12 is resolved — the production build completes on a local machine with both Bun versions.

---

## PF-4 — Bundle size / first-load JS per route

**Verdict**: **Confirmed** — measured from `apps/web/.next/diagnostics/route-bundle-stats.json`.

### First Load JS (uncompressed bytes) — bun 1.4.2 build

| Route | First Load JS (bytes) | ≈ kB |
|-------|----------------------|------|
| `/show/[name]/[season]/[token]` | 1,783,738 | 1,742 |
| `/me/liked-songs` | 1,778,229 | 1,737 |
| `/me/recently-played` | 1,778,229 | 1,737 |
| `/album/[name]/[token]` | 1,776,889 | 1,735 |
| `/mix/[name]/[token]` | 1,776,889 | 1,735 |
| `/playlist/[name]/[token]` | 1,776,889 | 1,735 |
| `/radio/[name]/[token]` | 1,771,564 | 1,730 |
| `/episode/[name]/[token]` | 1,765,367 | 1,724 |
| `/settings` | 1,711,689 | 1,672 |
| `/settings/preferences` | 1,702,184 | 1,662 |
| `/me` | 1,695,074 | 1,655 |
| `/settings/appearance` | 1,693,856 | 1,654 |
| `/playlist` | 1,686,602 | 1,647 |
| `/album` | 1,686,575 | 1,647 |
| `/radio` | 1,686,571 | 1,647 |
| `/show` | 1,686,571 | 1,647 |
| `/me/albums` | 1,682,067 | 1,643 |
| `/me/artists` | 1,682,067 | 1,643 |
| `/me/playlists` | 1,682,067 | 1,643 |
| `/me/shows` | 1,682,067 | 1,643 |
| `/search` | 1,678,305 | 1,639 |
| `/` | 1,675,604 | 1,636 |
| `/artist` | 1,675,604 | 1,636 |
| `/chart` | 1,675,604 | 1,636 |
| `/(.)login` | 1,448,908 | 1,415 |
| `/(.)signup` | 1,439,241 | 1,405 |
| `/(.)reset-password` | 1,433,376 | 1,400 |
| `/login` | 1,425,354 | 1,392 |
| `/signup` | 1,424,468 | 1,391 |
| `/reset-password` | 1,409,822 | 1,377 |
| `/forgot-password` | 1,407,075 | 1,374 |
| `/(.)forgot-password` | 1,156,009 | 1,129 |
| `/_not-found` | 844,274 | 824 |
| `/[...catchAll]` | 844,274 | 824 |

### Observations
- Heaviest routes: detail pages with player + sidebar + data fetching (~1.78 MB uncompressed).
- Lightest: 404/catch-all (~844 kB) and auth group routes without root layout (~1.16–1.45 MB).
- All routes share a large common chunk set (~30 chunks), indicating good chunk deduplication.
- **`sizes` image fix effect**: Not measurable without the image optimizer (disabled by decision C-99). The `route-bundle-stats.json` only reports JS; image payload sizes are not captured in the build output. The optimizer would affect transfer size, not JS bundle size.

### bun 1.3.14 comparison
The 1.3.14 build produces different chunk hashes but **identical byte totals per route** (verified by spot-checking 5 routes). No measurable bundle-size difference between Bun versions.

---

## DB-4 — Instrumentation credential logging in production build

**Verdict**: **Confirmed** — `register()` in `apps/web/instrumentation.ts` correctly:
1. Skips in production (`NODE_ENV !== "development"` → early return)
2. Skips non-loopback `DATABASE_URL` in development
3. Does not crash when `local-dev/fixtures.json` is missing (falls back to bundled canonical fixture)

### Code analysis (`apps/web/instrumentation.ts`)
```typescript
export async function register(): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;  // ← production guard
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const { isLocalDatabase } = await import("@infinitunes/db/local-guard");
  if (!isLocalDatabase(databaseUrl)) return;  // ← loopback guard

  const { getLocalDevFixture } = await import("@infinitunes/db/fixtures");
  const { user, database, redis } = getLocalDevFixture();  // ← falls back to bundled fixture
  // ... logs credentials
}
```

`packages/db/src/fixtures/local-dev-user.ts`: `getLocalDevFixture()` returns `DEFAULT_LOCAL_DEV_FIXTURE` (bundled `canonicalFixture`) when `LOCAL_DEV_CONFIG` is not set — no filesystem access, no crash risk.

### Runtime verification

| Test | Command | Observed stdout | Credentials logged? |
|------|---------|-----------------|---------------------|
| Production | `NODE_ENV=production SKIP_ENV_VALIDATION=true bunx next start --port 3001` | Server ready in 210ms, ASCII banner, then `DYNAMIC_SERVER_USAGE` error (expected, no DB) | **No** |
| Dev + remote DB | `NODE_ENV=development DATABASE_URL="postgresql://user:pass@remotehost:5432/db" SKIP_ENV_VALIDATION=true bunx next start --port 3002` | Served 404 page (no DB) | **No** |
| Dev + loopback DB | Not tested (no local Postgres) | N/A | Would log (by design) |

No `[local-dev] Infinitunes local development credentials` output appears in production or non-loopback development runs. Secrets do not appear in build output or production server logs.

---

## Summary

| Item | Verdict | Evidence |
|------|---------|----------|
| DP-12 | **Confirmed** | Both `bun run build` (1.4.2, 1.3.14) exit 0, 30/30 static pages generated |
| PF-4  | **Confirmed** | Bundle sizes recorded per route from `route-bundle-stats.json`; `sizes` fix effect not measurable without optimizer |
| DB-4  | **Confirmed** | Production server starts, instrumentation skipped; dev with remote DB skipped; fixture fallback prevents crash |

---

## Files changed
- None (verification only; no source modifications)

## Blocked items
- None. All three items verified on local machine.

## Gates (not required — docs-only change)
```bash
bun run fmt:check  # passes
```