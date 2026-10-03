# Library (`/me`)

**DRAFT. Last live proof: none.** Issues: ISSUE-004, ISSUE-006 in [verification-issues.md](../../../../docs/verification/verification-issues.md).

## Sub-features

- `/me` overview, `/me/albums`, `/me/artists`, `/me/shows`, `/me/liked-songs`, `/me/playlists`, `/me/playlist/[id]`.
- `/me/recently-played` is a static "Under development" page, but the sidebar links to it.
- Sub-navigation in `me/(layout-a)/_components/navbar.tsx`; logout control on the page.

## How to get to it (user POV)

User dropdown, sidebar entries `Recently Played` and `Your Favorite`.

## Driving it with browser skill (pending)

1. As guest open each `/me/*` URL; expect redirect to `/login`.
2. As a new user open each page; expect clear empty states, not errors.
3. After liking and creating playlists, expect the pages to show them (see [favorites.md](favorites.md), [playlists.md](playlists.md)).
4. Open `/me/recently-played`; expect the placeholder, and record that it is not a feature yet.

Observable end state: every library page renders for a user and redirects for a guest.

## Gotchas

- Do not mark `recently-played` as passing; it has no behavior.
