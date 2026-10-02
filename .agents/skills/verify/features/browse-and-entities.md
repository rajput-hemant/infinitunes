# Browse and entity pages

**DRAFT. Last live proof: none.** Issues: ISSUE-011, ISSUE-012, ISSUE-013, ISSUE-006 in [verification-issues.md](../../../../docs/checks/verification-issues.md).

## Sub-features

- Home (`/`) with language bar and sliders; language picker in the header (`components/site-header/language-picker.tsx`).
- Index pages: `/album`, `/artist`, `/chart`, `/playlist`, `/show`, `/radio` (sidebar titles: Top Albums, Top Charts, Top Playlists, Podcasts, Top Artists, Radio).
- Entity pages: album, artist (tabs and category filter), playlist, mix, label, song, episode, show season, radio station.
- Loading skeletons per route (`loading.tsx`), `error.tsx` and `not-found.tsx`.
- Data comes from the live JioSaavn API through tRPC routers in `packages/trpc/src/router`.

## How to get to it (user POV)

Sidebar links, header nav, slider cards, search results.

## Driving it with browser skill (pending)

1. Launch and run the doctor. Open each index route above; expect HTTP 200 and non-empty cards with images.
2. Open one entity of each type from a card; expect title, artwork, song list and the details header actions.
3. Change language in the picker; expect home sliders to reload for that language.
4. Open `/nope-xyz`: expect 404 page. Open `/song/x/invalid-token`: record what renders (prior run saw the generic error page).
5. Check the loading skeletons by throttling, and that no route shows a 500.

Observable end state: every index and entity route renders real catalogue data without console errors or horizontal overflow.

## Gotchas

- Pages fetch upstream at request time; an upstream outage looks like an app 500 (ISSUE-011).
- `/mix`, `/label`, `/episode` have entity pages but no index; reach them from cards.
- `proxy.ts` normalizes only names listed in `appRoutes`, which contains `/playlists`, not `/playlist` (ISSUE-006).
