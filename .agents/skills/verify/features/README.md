# Infinitunes feature map (DRAFT)

Every file here is **DRAFT** with `Last live proof: none`. Nothing has been driven in a browser. Driving steps name real routes and labels from source; the browser harness is pending the user-selected skill (see [../SKILL.md](../SKILL.md)). Issues live only in [docs/archive/verification-issues.md](../../../../docs/archive/verification-issues.md).

Auth model: Better Auth with email + password, passkey (WebAuthn) and Google/GitHub OAuth. There are no anonymous or guest accounts. A guest is simply a request with no session cookie; it can browse public pages, use the player and change local preferences, but `/me` redirects to `/login` and every user-data tRPC procedure returns `UNAUTHORIZED`.

| Feature                                    | File                                             | Auth needed     | Last live proof |
| ------------------------------------------ | ------------------------------------------------ | --------------- | --------------- |
| Email signup, login, logout, session       | [auth-email.md](auth-email.md)                   | guest then user | none            |
| Passkey enroll and sign-in                 | [auth-passkey.md](auth-passkey.md)               | user            | none            |
| OAuth entry (Google, GitHub)               | [auth-oauth.md](auth-oauth.md)                   | guest           | none            |
| Guest vs user access, proxy, tRPC boundary | [access-control.md](access-control.md)           | both            | none            |
| Account settings, password change, delete  | [account-settings.md](account-settings.md)       | user            | none            |
| Browse and entity pages                    | [browse-and-entities.md](browse-and-entities.md) | guest           | none            |
| Search                                     | [search.md](search.md)                           | guest           | none            |
| Player, queue, download                    | [player-queue.md](player-queue.md)               | guest           | none            |
| Favorites (likes)                          | [favorites.md](favorites.md)                     | user            | none            |
| User playlists                             | [playlists.md](playlists.md)                     | user            | none            |
| Library (`/me`)                            | [library.md](library.md)                         | user            | none            |
| Appearance and preferences                 | [preferences.md](preferences.md)                 | guest           | none            |
| Radio                                      | [radio.md](radio.md)                             | guest           | none            |
| UI quality and responsive layout           | [ui-quality.md](ui-quality.md)                   | both            | none            |

## Route inventory (from `apps/web/app`)

Public: `/`, `/album`, `/album/[name]/[token]`, `/artist`, `/artist/[name]/[token]`, `/chart`, `/episode/[name]/[token]`, `/label/[name]/[token]`, `/mix/[name]/[token]`, `/playlist`, `/playlist/[name]/[token]`, `/radio`, `/radio/[name]/[token]`, `/search`, `/search/[type]/[query]`, `/show`, `/show/[name]/[season]/[token]`, `/song/[name]/[token]`, `/settings`, `/settings/appearance`, `/settings/preferences`.

Auth pages (redirect to `/` when a session exists): `/login`, `/signup`, `/forgot-password`, `/reset-password`, also intercepted as modals via `app/@modal/(.)login|signup|forgot-password|reset-password`.

Protected (`userRoutes = ["/me"]`): `/me`, `/me/albums`, `/me/artists`, `/me/liked-songs`, `/me/playlists`, `/me/playlist/[id]`, `/me/recently-played`, `/me/shows`.

APIs: `/api/auth/[...all]` (Better Auth), `/api/trpc/[trpc]`, `/api/og`.
