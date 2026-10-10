# Passkey enrollment and sign-in

**DRAFT. Last live proof: none.** Issues: ISSUE-014 in [verification-history.md](../../../../docs/archive/verification-history.md).

## Sub-features

- Add passkey: settings section `Passkeys` (`settings/_components/passkey-settings.tsx`, `authClient.passkey.addPasskey`); toast `Passkey added.`; cancel gives `Passkey enrollment was cancelled.`.
- List and remove passkeys (`listUserPasskeys`, `deletePasskey`); empty state `No passkeys yet. Add one to enable passwordless sign-in.`.
- Sign in: `Sign in with Passkey` on `/login` (`authClient.signIn.passkey`); cancel gives `Passkey sign-in was cancelled.`.
- Server: `@better-auth/passkey` plugin, table `infinitunes_passkey`, `rpID` from `BETTER_AUTH_RP_ID` or the `AUTH_URL` hostname, `origin` = base URL.

## How to get to it (user POV)

Settings (`/settings`) while signed in for enroll and remove; `/login` for sign-in.

## Driving it with browser skill (pending)

Needs a WebAuthn authenticator. With a CDP-capable browser skill, use a virtual authenticator (platform, resident key, user verification on).

1. Launch on `localhost` with `AUTH_URL=http://localhost:3000` so `rpID` is `localhost`.
2. Sign up and log in by email (see [auth-email.md](auth-email.md)); open `/settings`.
3. Click add passkey; expect toast `Passkey added.` and one list entry.
4. Verify `select count(*) from infinitunes_passkey` is 1 for the user.
5. Log out, open `/login`, click `Sign in with Passkey`; expect `You have been signed in.` and `/me` access.
6. Remove the passkey; expect `Passkey removed.` and the row gone.

Observable end state: passkey row lifecycle matches the UI and passkey login yields a session without a password.

## Gotchas

- The origin and `rpID` must match the exact host used in the browser; `127.0.0.1` vs `localhost` will fail.
- A passkey-only user has no password; `resetPassword` returns a "does not have a password" error for them (see [account-settings.md](account-settings.md)).
- No test in the repo exercises the real WebAuthn ceremony.
