# OAuth entry points (Google, GitHub)

**DRAFT. Last live proof: none.** Issues: ISSUE-015 in [verification-issues.md](../../../../docs/checks/verification-issues.md).

## Sub-features

- Buttons in `app/(auth)/_components/oauth-buttons.tsx` call `authClient.signIn.social` for `google` and `github`.
- Account linking is disabled (`accountLinking.enabled: false`, `disableImplicitLinking: true`); a collision shows toast `OAuth Account Not Linked` on the login and signup forms.
- Client id and secret are optional outside production, required when `NODE_ENV=production` (`packages/env/src/schema.ts`).

## How to get to it (user POV)

Buttons under the email form on `/login` and `/signup` (and the modal variants).

## Driving it with browser skill (pending)

1. Launch with the inert OAuth placeholders from [SKILL.md](../SKILL.md).
2. Click each provider button; expect a redirect toward the provider authorize URL (the first migration smoke recorded this as "PASS to the provider redirect only").
3. Stop there. Do not log in at Google or GitHub, and never use real or shared credentials.

Observable end state: redirect URL host is the provider and includes the app callback under `/api/auth/callback/<provider>`.

## Gotchas

- The provider round trip, callback URLs and account-collision toast need real OAuth apps and are out of scope for disposable verification. Treat them as a GAP, not a pass.
- Callback URLs depend on `AUTH_URL`; recheck on a Vercel preview.
