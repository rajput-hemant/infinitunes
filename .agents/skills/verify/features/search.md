# Search

**DRAFT. Last live proof: none.** Issues: ISSUE-012 in [verification-issues.md](../../../../docs/checks/verification-issues.md).

## Sub-features

- Command-style search menu (`components/search/search-menu.tsx`), shortcut Cmd+K / Ctrl+K, input placeholder `Search`.
- Mobile search at `/search` (`search/_components/mobile-search.tsx`).
- Results page `/search/[type]/[query]` with type navbar and `search-results.tsx`; types include song, album, artist, playlist, show.
- Empty results handling (`packages/trpc/tests/empty-results.test.ts` covers the router).

## How to get to it (user POV)

Search field in the header, Cmd/Ctrl+K, or `/search` on mobile.

## Driving it with browser skill (pending)

1. Open `/`, press Ctrl+K (Cmd+K on macOS); expect the dialog, type `arijit`, expect grouped suggestions.
2. Press Enter or pick a result; expect navigation to `/search/<type>/<query>` and results.
3. Switch type tabs; expect the URL type segment and list to change.
4. Search for a nonsense string; expect a clear empty state, no crash.
5. At 390px width open `/search`; expect the mobile input and results with no overflow.

Observable end state: URL reflects type and query, results are real catalogue items, empty query paths do not error.

## Gotchas

- Raw HTML entities in titles were seen upstream (ISSUE-012); check `&quot;` in results.
- Special characters in the query must be URL-encoded in the path segment.
