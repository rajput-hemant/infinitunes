# Favorites (likes)

**DRAFT. Last live proof: none.** Issues: ISSUE-003 in [verification-issues.md](../../../../docs/verification/verification-issues.md).

## Sub-features

- `Like` button (`components/like-button.tsx`) on detail headers; guests get toast `Unable to perform action. Please sign in.`.
- tRPC `user.addToFavorites`, `removeFromFavorites`, `getUserFavorites` (`packages/trpc/src/router/user.ts`); first favorite is an atomic upsert (`favorites-concurrency.test.ts`).
- Types: song, album, playlist, artist, show; stored as arrays in `infinitunes_favorite`.
- Lists: `/me/liked-songs`, `/me/albums`, `/me/artists`, `/me/shows`.
- The `Add To Favourite` item in the song-row `More Options` menu is a stub (ISSUE-003).

## How to get to it (user POV)

Heart button on an album, artist, playlist or show header; library pages under `/me`.

## Driving it with browser skill (pending)

1. As guest click `Like` on an album; expect the sign-in warning toast and no DB row.
2. Sign in, like an album, an artist and a show; expect success toasts and rows/array entries in `infinitunes_favorite`.
3. Open `/me/albums`, `/me/artists`, `/me/shows`; expect each liked item.
4. Unlike; expect removal from the list and the array.
5. Rapidly double-click the first like on a fresh user; expect one row, no duplicate error.

Observable end state: the favorites row and the library pages agree with each action.

## Gotchas

- Song likes via the row menu are not implemented; use only what the UI exposes.
- Check per-user isolation by creating two users and confirming neither sees the other's items.
