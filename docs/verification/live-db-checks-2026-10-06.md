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
