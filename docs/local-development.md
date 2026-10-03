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

## Database layout

- The `user` table and the `better_auth_*` tables are unprefixed and may be shared with other applications using the same database.
- Infinitunes tables are prefixed `infinitunes_` so they cannot collide with other entities.
- Migrations are in `packages/db/src/migrations`; `bun run db:migrate` creates everything Infinitunes needs on an empty database.

## Seed

`bun run db:seed` is idempotent and inserts only the fixture user, its credential, one playlist and favorites, in one transaction. It refuses to run when:

- `DATABASE_URL` is not a loopback host (`localhost`, `127.0.0.1`, `::1`) or sets `host` in its query string
- `NODE_ENV=production`
- the fixture id or email already belongs to a different user

It never changes an existing account.

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

## Resetting

There is no reset command. To start clean, run `bun run db:down`, then remove the two named volumes yourself. Volumes from older setups (including any PostgreSQL 17 volume) are never touched or adopted automatically; PostgreSQL 18 cannot read PG17 data, so move it with `pg_dump` and restore if needed. Never run `docker system prune` for this.
