# Local Development

Docker runs only infrastructure. The app, migrations and seed run on host Bun 1.4.2.

## Services

All ports bind to `127.0.0.1`.

| Service               | Image                                | Port   |
| :-------------------- | :----------------------------------- | :----- |
| PostgreSQL            | `postgres:18.6-alpine`               | `5432` |
| Redis                 | `redis:7.4-alpine`                   | `6379` |
| Serverless Redis HTTP | `hiett/serverless-redis-http:0.0.10` | `8079` |
| Web app (host Bun)    | -                                    | `3000` |

Compose project `local-platforms`, database `local_platforms`, volumes `local_platforms_pgdata_18` and `local_platforms_redis_data`. Starting the stack again from any checkout that uses the same compose file reuses the same containers and data.

## Setup

```bash
cp .env.example .env
bun install
bun run db:up
bun run db:migrate
bun run db:seed
bun run dev
```

Open http://localhost:3000.

## Local credentials

Defined in `local-dev/fixtures.json` (loaded by `packages/db/src/fixtures/local-dev-user.ts`):

| Field    | Value                                  |
| :------- | :------------------------------------- |
| ID       | `a0000000-0000-4000-8000-000000000001` |
| Email    | `local@example.test`                   |
| Password | `LocalDev123!`                         |
| Name     | `Local Developer`                      |

Auth is email and password only. `LOCAL_DEV_CONFIG` can point to another fixture file; when set it must exist and match the schema, otherwise seeding fails.

`bun run dev` prints the email and password once at startup (`[local-dev] Sign in with ...`, from `apps/web/instrumentation.ts`). It prints only when `DATABASE_URL` is a loopback host and `NODE_ENV` is not `production`; production builds drop the code entirely.

## Database layout

- The `user` table and the `better_auth_*` tables are unprefixed and shared with other applications using the same database (see [Shared database](#shared-database-with-lipi)).
- Infinitunes tables are prefixed `infinitunes_` so they cannot collide with other entities.
- Migrations are in `packages/db/src/migrations`; `bun run db:migrate` creates everything Infinitunes needs on an empty database, or on one a sibling app already populated.

## Seed

`bun run db:seed` is idempotent. In one transaction it inserts the fixture user and credential, then sample data owned by that user, all from `local-dev/fixtures.json` (plain ids and tokens, no JioSaavn call at seed time):

| Table                         | Rows                                                                                                     |
| :---------------------------- | :------------------------------------------------------------------------------------------------------- |
| `infinitunes_playlist`        | 2 playlists (2 and 3 songs)                                                                              |
| `infinitunes_favorite`        | 1 row: 3 liked songs, 2 albums, 2 artists, 1 JioSaavn playlist (song, album, artist and playlist tokens) |
| `infinitunes_recently_played` | 3 songs, played 5, 30 and 120 minutes ago                                                                |

Every insert is `ON CONFLICT DO NOTHING`, so a rerun adds nothing and never changes an existing row. If a sibling app seeded the same user first, the user and credential are reused. Seeding refuses to run when:

- `DATABASE_URL` is not a loopback host (`localhost`, `127.0.0.1`, `::1`) or sets `host` in its query string
- `NODE_ENV=production`
- the fixture id or email already belongs to a different user

A user who already has a favorites row keeps it, so the sample favorites only appear on a fresh account.

## Shared database with Lipi

Infinitunes and Lipi use one database (`local_platforms`) and one set of accounts, so the same login works in both apps. Either app may migrate and seed first.

- **Tables.** Infinitunes owns `infinitunes_*`. `user` and `better_auth_*` are shared; Lipi documents their column contract. Infinitunes declares `user.name` and `user.password` (nullable) because Lipi writes them. Only the seed sets `name`; the app uses `betterAuthName`. Do not make them required.
- **Idempotent baseline.** `0000_baseline.sql` uses `CREATE TABLE IF NOT EXISTS`, `CREATE UNIQUE INDEX IF NOT EXISTS` and foreign keys guarded by `duplicate_object`, so it reuses tables Lipi created first. Existing databases are unaffected: drizzle applies by timestamp, not file content.
- **Migrations 0007 and 0008.** 0007 keeps its guard that blocks when legacy `user.password` hashes have no matching Better Auth credential (Lipi always writes both), but no longer drops `user.name` and `user.password`. Databases that already ran the old 0007 get both columns back from 0008 (`ADD COLUMN IF NOT EXISTS`); their previous values are gone.
- **History and filtering.** Infinitunes history lives in `drizzle.__drizzle_migrations`; Lipi uses `drizzle.__lipi_migrations` and `drizzle.__lipi_auth_migrations`. `tablesFilter` is `infinitunes_*`, which limits `db:push` and `db:pull` to Infinitunes tables. `db:generate` diffs the snapshot and still includes the shared auth tables, and `db:studio` ignores the filter and lists every table in `schema.ts` including the shared auth tables, so edit users there with care.
- **Cookies.** Cookies are not port-isolated on `localhost`, so two apps would overwrite each other's `better-auth.session_token`. Outside production Infinitunes uses the cookie prefix `infinitunes` (`infinitunes.session_token`), set in `apps/web/lib/session-cookie.ts` for both Better Auth and `proxy.ts`. Sessions are therefore per app: sign in once in each. Production keeps the default name so existing sessions survive. Nothing needs `BETTER_AUTH_SECRET` to match across apps.
- **Verified.** `packages/db/tests/shared-database.test.ts` creates a scratch database holding Lipi-style auth tables, an app table and history, runs `db:migrate` and `db:seed` twice, and checks nothing was duplicated, altered or dropped. It runs when `TEST_MIGRATION_DATABASE_URL` points at a disposable Postgres admin URL; it creates and drops its own databases.

## Commands

| Command              | Description                      |
| :------------------- | :------------------------------- |
| `bun run db:up`      | Start PostgreSQL, Redis, adapter |
| `bun run db:down`    | Stop them                        |
| `bun run db:migrate` | Apply migrations                 |
| `bun run db:seed`    | Seed local data                  |
| `bun run dev`        | Start the app                    |
| `bun run test`       | Run tests                        |
| `bun run type-check` | Type-check                       |
| `bun run lint`       | Lint                             |

## Rate limiting (production)

Off by default; nothing needs Upstash to boot. It runs only when `NODE_ENV=production`. To turn it on set:

| Variable                                             | Value                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| `ENABLE_RATE_LIMITING`                               | `true` (env validation fails without the two Upstash vars) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash REST credentials                                   |
| `TRUSTED_PROXY`                                      | optional; see below                                        |
| `RATE_LIMITING_REQUESTS_PER_SECOND`                  | optional, default `50` per client                          |

On Vercel `ENABLE_RATE_LIMITING=true` plus the credentials is enough: `TRUSTED_PROXY` defaults to `vercel`.

`TRUSTED_PROXY` decides which client-IP headers the limiter believes, because `x-forwarded-for` is forgeable by any client that reaches the app directly:

- `vercel`: Vercel overwrites the headers; uses `x-real-ip`, then the first `x-forwarded-for` entry. Default on Vercel.
- `true`: one trusted reverse proxy that appends to `x-forwarded-for`; uses `x-real-ip`, then the last entry.
- `false`: default elsewhere. Headers are ignored and all clients share one bucket, so the limit becomes a global cap. Safe, but set `true` or `vercel` for per-client limits.

The limiter covers pages, `/api/trpc` and `/api/auth` with the global bucket. `POST /api/auth/sign-in/email` and `/sign-up/email` also get a stricter 10 per minute bucket. Better Auth's own database-backed limiter (3 per 10s on sign-in/up, 3 and 5 per minute on forgot/reset password) stays in place; the reset endpoints are not limited again in the proxy.

## Resetting

There is no reset command. To start clean, run `bun run db:down`, then remove the two named volumes yourself. Volumes from older setups (including any PostgreSQL 17 volume) are never touched or adopted automatically; PostgreSQL 18 cannot read PG17 data, so move it with `pg_dump` and restore if needed. Never run `docker system prune` for this.
