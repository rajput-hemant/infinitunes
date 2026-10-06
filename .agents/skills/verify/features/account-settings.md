# Account settings, password change, delete account

**DRAFT. Last live proof: none.** Issues: ISSUE-005, ISSUE-007, ISSUE-008, ISSUE-009 in [verification-issues.md](../../../../docs/archive/verification-issues.md).

## Sub-features

- Profile form (`settings/_components/profile-form.tsx`): Name, Email, New Password, `Save Changes` calls `updateUser` through a server action.
- The former `Verify Email` and avatar `Edit` stub buttons (which showed an "in development" toast) are no longer in `profile-form.tsx` (source grep; not re-run in a browser).
- Danger zone: `Delete Account` opens a confirm dialog that enables the action only after typing `DELETE MY ACCOUNT`; calls `deleteUser`.
- Password reset: `/forgot-password` (`forgot-password-form.tsx`) requests an emailed link; `/reset-password?token=...` (`reset-password-form.tsx`) takes new password and confirm, calls `authClient.resetPassword`, then redirects to `/login`. A missing, expired or used token shows `Request a new link`.
- Passkey management lives on the same settings page (see [auth-passkey.md](auth-passkey.md)).

## How to get to it (user POV)

`/settings` from the user dropdown; `/forgot-password` from the login form link.

## Driving it with browser skill (pending)

1. Signed in as a throwaway user, open `/settings`; change Name, save, reload; expect the new name.
2. Change the password via the New Password field; log out and log in with the new password. Check `better_auth_account.password` and `user.password` hashes both changed (they are mirrored).
3. Open `/reset-password` with no token or a bad token; expect the invalid-link message. Reset with a real emailed link is only testable with a configured mail sender.
4. Delete account: type the phrase, confirm; expect the user row and dependent playlist and favorite rows gone and a logged-out state.
5. Guest opens `/settings`: expect `Please sign in to view this page.`, no form.

Observable end state: DB rows match each UI action; old password stops working after change; deleted user cannot log in.

## Gotchas

- `updateUser` accepts any string as email server-side and does not re-verify; duplicates hit the unique constraint (ISSUE-008).
- Delete confirmation exists only in the UI (ISSUE-009).
- Never drive this against a real account; use only users created in the disposable database.
