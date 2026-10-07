# Browser verify 2, 2026-10-07

Branch `task/browser-verify2` (from `migration/bun-monorepo`). `next dev` on port 3210 with the
main checkout's `.env.local` copied in (not committed, deleted afterwards), run under Node with
`NODE_OPTIONS=--openssl-legacy-provider` so download URLs resolve. Real JioSaavn upstream
(reachable, 200). Chrome via chrome-devtools-axi, logged out. The local Postgres on 5432 was
not running, so nothing signed-in was exercised.

Only what was measured is claimed. "Source" means read from code, not seen live.

| # | Check | Result |
| - | ----- | ------ |
| 1 | UI-48 no "NaN Plays" | Song `/song/dracula/NV45QSNIY2c` header reads "Song · 3.3M Plays · 03:29 · English"; episode header reads "Episode · 555.8K Plays · 10:00 · Marathi"; `/NaN/` absent from `body.innerText` on both and on an album page. Live data always had a count, so the missing-count branch (`Number(count) > 0` in `details-header.tsx`) was not exercised live (source only). |
| 2 | UI-56..58 credits and "+N more" | Seen on `/playlist/90s-duets-hindi/...` (4 rows with 4 credits): row `title` holds all 4 names, visible "+1 more" (57px wide, shrink-0) sits beside the clamped first span, the 4th credit is an `sr-only` link with the right `href`. No album or song page I sampled (about 15 albums, 1 song) had more than 3 credits, so the suffix was only seen on a playlist. **Defect found, fixed:** keyboard focus on the hidden credit left it clipped (`inset(50%)`, 1x1 parent), an invisible focus stop. |
| 3 | `dark:drop-shadow` clipping | Computed `filter` on `/`, `/playlist`, `/song/...`, `/search?q=love`: light has no heading drop-shadow (only the empty-state illustration's intentional `drop-shadow-sm` on `/search`); dark has 3 to 8 shadowed elements per page, e.g. `drop-shadow(rgba(0,0,0,0.12) 0 3px 3px)` on h1/eyebrow. For each, I walked the ancestors with non-visible overflow and compared the gap to the shadow offset: 0 clipped elements in any page, either scheme. Pixel-level appearance not reviewed. The change is on headings only (no card uses `drop-shadow`; cards were not separately inspected). |
| 4 | UI-24 Empty and Alert states in library | Not done: library needs a database and a session, and Postgres was down. |
| 5 | UI-40 queue row removal | Started a playlist (32 queued songs), opened the queue sheet at 1280, removed row 3 and sampled every frame. Before the fix: height 64 to 42 to 25 to 8, opacity 1 to 0.66 to 0.4 to 0.07, translateX to about -8px (so the earlier "no transition seen" note was a sampling miss), then a floor of 8px until the row left the DOM at about 250 to 350 ms, where the next row jumped 254 to 246 (an 8px snap). **Defect fixed:** the row gap is `pb-2` on the collapsing inner div, which a `0fr` row does not collapse. After the fix: height 64 to 13 to 0.9, next row top 310 to 247 to 246 (1px residual), no snap. I removed one row, not several in a row, so rapid-removal retargeting was not sampled. |
| 6 | Mega menu at 1280 | "Music" opens (`aria-expanded`), 20+ links, "View all Music" and the sections render; clicking "Bass Persuades" navigated to `/album/bass-persuades/W6tkoViwypg_`. **Defect found, fixed:** titles showed raw entities (`Bhootni Ka (From &quot;Udta Teer&quot;)`) in text and tooltip. |
| 7 | 320 and 1920 overflow | `/`, `/song/dracula/...`, `/search`, `/search?q=love`: `scrollWidth == innerWidth` at 1920 and at 320 (Chrome refuses to resize a window below 500, so 320 used device emulation `320x640 mobile`; a first run at "320" actually measured 500 and was discarded). No element extended past the viewport outside scroll containers, sheets or fixed elements. Screenshot of `/` at 320: [home-320.png](browser-verify2-2026-10-07/home-320.png). Mega menu at 1280: [megamenu-1280.png](browser-verify2-2026-10-07/megamenu-1280.png). |
| 8 | Reduced motion and mobile nav | Chrome relaunched with `--force-prefers-reduced-motion` (`matchMedia` reduce = true) at 390x844 mobile: bottom nav at y=788, 5 items of 78x56, opacity 1, 0 running animations; "Library" opened the sidebar sheet fully in place (x 0, 293 wide, transform none), Escape closed it, "Browse" navigated to `/browse` with no horizontal overflow. |

## Defects fixed (3)

| Commit | Subject | Test |
| ------ | ------- | ---- |
| `9bc5092` | fix(nav): decode HTML entities in mega menu titles | `tests/dom/main-nav.test.tsx` (fails on old code) |
| `099ae55` | fix(a11y): reveal hidden artist credits on keyboard focus | class assertion in `tests/dom/artist-links.test.tsx` (happy-dom has no layout, so the visible result was measured in Chrome: 90x17 and inside the row) |
| `611f78c` | fix(queue): animate row gap away so removal does not snap | class assertion in `tests/dom/queue-sheet.test.tsx`; the 8px snap itself was measured in Chrome |

Gates after the changes (via `heavy`): `fmt:check` clean, `type-check` pass, `lint` 0 errors and 10 web warnings (baseline), `test` 0 failures.

## Not verified

- UI-24 (Empty and Alert states), anything signed-in: no database.
- UI-48 with a genuinely missing play count.
- Light-versus-dark shadow appearance by eye; only computed style and clipping geometry.
- Mega menu keyboard operation, and widths between the sampled ones; 200% zoom and forced-colors were not part of this task.
- Rapid multi-row queue removal.
