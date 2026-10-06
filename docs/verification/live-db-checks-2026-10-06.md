# Live DB Verification - 2026-10-06

Branch: `task/live-db` (rebased on `origin/migration/bun-monorepo`)

Worktree: `/Users/rajput-hemant/.treehouse/infinitunes-5ea9b0/3/infinitunes`

Database: `infinitunes_live` on `127.0.0.1:3100` (separate from J's `infinitunes_verify` on 3200)

---

## PT-63: Seed Idempotency ✅ CONFIRMED

**Task**: Run `bun run db:seed` twice against the DB and confirm one row each for user, playlist, favorites.

**Commands**:

```bash
heavy bun run db:seed  # Run 1
heavy bun run db:seed  # Run 2
```

**Output (Run 1)**:

```
$ bun run --filter @infinitunes/db db:seed
@infinitunes/db db:seed: [seed] Connecting to database: postgres://postgres:***@127.0.0.1:3100/infinitunes_live
@infinitunes/db db:seed: [seed] Seeding successfully completed.
@infinitunes/db db:seed: Exited with code 0
```

**Output (Run 2)**:

```
$ bun run --filter @infinitunes/db db:seed
@infinitunes/db db:seed: [seed] Connecting to database: postgres://postgres:***@127.0.0.1:3100/infinitunes_live
@infinitunes/db db:seed: [seed] Seeding successfully completed.
@infinitunes/db db:seed: Exited with code 0
```

**Verification** (after both runs):

```sql
SELECT id, email, name FROM "user";
-- 1 row: a0000000-0000-4000-8000-000000000001 | local@example.test | Local Developer

SELECT * FROM infinitunes_playlist;
-- 1 row: b0000000-0000-4000-8000-000000000001 | Local Favorites | Deterministic local development playlist | a0000000-0000-4000-8000-000000000001 | {OF0RBBVqWXI,c911v0kF} | 2026-10-06 08:59:16.51804

SELECT * FROM infinitunes_favorite;
-- 1 row: c0000000-0000-4000-8000-000000000001 | a0000000-0000-4000-8000-000000000001 | {OF0RBBVqWXI} | {} | {b0000000-0000-4000-8000-000000000001} | {} | {}
```

**Verdict**: **Confirmed** - The seed is idempotent. Running twice leaves exactly one user, one playlist, and one favorites record. No duplicates created.

**Note**: This was NOT verified in batch4 (batch4 recorded PT-63 as "needs local environment" and not done). This verification is new.

---

## TC-3: Real bcrypt/password-change paths ✅ CONFIRMED

**Task**: Drive the real bcrypt/password-change paths in `apps/web/lib/actions.ts` and `packages/trpc/src/router/user.ts` against the database.

**What was tested**:

1. Current password hash verification (credential account hash)
2. New password hashing with bcrypt cost 10
3. Transactional update of both `users.password` and `betterAuthAccounts.password`
4. New password verification works, old password no longer works
5. Session revocation logic (keep current token, delete others)

**Commands**:

```bash
cd packages/db
DATABASE_URL=postgres://postgres:postgrespassword@127.0.0.1:3100/infinitunes_live bun run test-tc3.ts
```

**Output**:

```
=== Testing real bcrypt/password-change paths (TC-3) ===

1. Checking current password hash...
   User record password: set
   Credential account password: set
   Stored hash source: credential account
   Original password matches: true

2. Hashing new password with bcrypt cost 10...
   New hash: $2b$10$WEpFUgbJoeSju...

3. Updating password hashes in database (transaction)...
   Transaction committed

4. Verifying new password works...
   New password matches: true
   Old password matches (should be false): false

5. Testing session revocation (keeping current token)...
   Remaining sessions: 1 (should be 1)
   Remaining token: test-current-token (should be test-current-token)

6. Restoring original password...
   Original password restored

=== All TC-3 tests passed ===
```

**Verdict**: **Confirmed** - The real bcrypt/password-change paths work correctly:

- Password verification against credential account hash works
- bcrypt cost 10 hashing works
- Transactional update of both password columns works
- Session revocation (keeping current token) works
- All paths exercise real database operations, not mocks

**Note**: This was NOT verified in batch4 (TC-3 is still listed as "needs local environment" in batch4). This verification is new.
