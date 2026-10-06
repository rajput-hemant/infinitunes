# Email signup, login, logout, session

**Status: LIVE PROOF.** Signup, session persistence, /me access, settings access, logout, post-logout redirect, and post-login client redirect (fixed in ISSUE-023) confirmed in browser runs `browser-radio-3151` and `infinitunes-radio-auth-fixes` (2026-10-02).
Issues: [ISSUE-019](../../../../docs/archive/verification-issues.md#issue-019), [ISSUE-023 (closed)](../../../../docs/archive/verification-issues.md#issue-023).

Last live proof: 2026-10-02, runs `browser-radio-3151` and `infinitunes-radio-auth-fixes` (evidence kept outside the repo).

## Sub-features

- Signup: email, password, confirm password (`apps/web/app/(auth)/_components/signup-form.tsx`, `authClient.signUp.email`); toast `Account Created Successfully`.
- Login: `Login with Email` (`login-form.tsx`, `authClient.signIn.email`); toast `You have been signed in.`
- Password rules (`packages/auth/src/schemas.ts`): at least 8 chars, upper, lower, digit, special, no all-whitespace; confirm must match.
- Logout (`me/(layout-a)/_components/logout.tsx` and user dropdown).
- Session: 30 day expiry, 1 day refresh, cookie cache off (`packages/auth/src/auth.ts`); cookie httpOnly, `sameSite=lax`, `secure` only in production.
- A signed-in user hitting `/login`, `/signup`, `/reset-password` is redirected to `/` (`proxy.ts`).

## How to get to it (user POV)

Header or user dropdown shows login; `/login` and `/signup` render as a modal (`@modal`) when navigated from inside the app and as full pages on direct load. Toggle between them with `auth-mode-toggle.tsx`.

## Driving it with browser skill (reference)

1. Launch per [SKILL.md](../SKILL.md). Open `http://localhost:3000/signup` directly.
2. Submit invalid inputs one at a time (empty, bad email, weak password, mismatched confirm); expect inline field errors, no request.
3. Sign up with a throwaway `verify-<run>@example.invalid` and a password meeting the rules; expect the success toast and a session cookie.
4. Confirm the row: `docker compose exec postgres psql -U postgres -d local_platforms -c 'select id,email from "user"'` and a `credential` row in `better_auth_account`.
5. Reload; `/me` must still render (session persistence). Log out; `/me` must redirect to `/login`.
6. Log in again with the same credentials; wrong password must show an error toast and keep the user logged out.
7. While logged in, open `/login`; expect redirect to `/`.

Observable end state: user row exists, session survives reload, logout removes access to `/me`.

## Gotchas

- `AUTH_URL` must match the browser origin, or Better Auth and the `/api/trpc` origin check reject requests.
- Email verification is not required (`requireEmailVerification: false`); no outgoing mail is sent by signup.
- Non-browser unit coverage exists (`packages/auth/tests/auth.test.ts`, `schemas.test.ts`) but proves nothing about the form or cookies.
