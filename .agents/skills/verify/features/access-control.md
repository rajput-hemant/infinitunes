# Guest vs user access, proxy and tRPC boundary

**DRAFT. Last live proof: none.** Issues: ISSUE-006, ISSUE-010, ISSUE-020 in [verification-issues.md](../../../../docs/verification/verification-issues.md).

## Sub-features

- Guest model: no anonymous accounts. Guest = no session cookie.
- `apps/web/proxy.ts`: `/me` and `/me/*` redirect guests to `/login` (307); `/login`, `/signup`, `/reset-password` redirect signed-in users to `/`; `/settings` stays public with a guest empty state.
- Two-segment normalization: `/album/foo` redirects to `/album` for names in `appRoutes`.
- `/api/trpc` origin/referer check returns 403 `Forbidden: Invalid origin or referer`; missing origin and referer is treated as same-origin.
- Rate limit (429 `Too many requests`) only when `ENABLE_RATE_LIMITING=true`, `NODE_ENV=production` and Upstash is configured.
- tRPC: `protectedProcedure` throws `UNAUTHORIZED` without a session; `user.resetPassword` and all browse routers are public.

## How to get to it (user POV)

Visit protected URLs directly while logged out, then logged in; try auth pages while logged in.

## Driving it with browser skill (pending)

Non-browser parts can run now against a launched app:

1. `curl -si http://localhost:3000/me` as guest: expect `307` and `location: .../login`.
2. `curl -si http://localhost:3000/settings`: expect `200` (guest empty state).
3. `curl -si -X POST 'http://localhost:3000/api/trpc/user.getUserPlaylists' -H 'origin: http://evil.example'`: expect `403`.
4. `curl -s 'http://localhost:3000/api/trpc/user.getUserPlaylists?input=%7B%7D'` with matching origin and no cookie: expect an `UNAUTHORIZED` tRPC error body.

Browser parts: log in, then open `/login` (expect redirect to `/`); log out, open `/me/liked-songs` (expect `/login`); confirm the guest settings page shows `Please sign in to view this page.` with a `Sign in` link, and the sidebar renders its guest branch instead of the playlist section (`components/sidebar.tsx`).

Observable end state: guest cannot read or mutate user data by page or API; signed-in user cannot reach auth pages.

## Gotchas

- Unit tests (`apps/web/tests/proxy.test.ts`, `security.test.ts`, `packages/trpc/tests/user-router.test.ts`) mock `next/server` and cookies, so they do not prove real redirects.
- `getSessionCookie` only checks cookie presence in the proxy; the server still validates the session for data (a forged cookie passes the redirect but not tRPC).
- Rate limiting cannot be exercised without Upstash and a production build.
