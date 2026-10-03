# Local Development Guide

## Architecture Overview

Local development for **Infinitunes**, **Lipi**, and **AMA** uses a shared, resource-only infrastructure model designed for resource efficiency and speed:

1. **Docker starts infrastructure only:**
   - **PostgreSQL 18.6-alpine** (host `127.0.0.1:5432`): Shared single database (`local_platforms`) for Infinitunes and Lipi.
   - **Redis 7-alpine** (host `127.0.0.1:6379`): Lightweight in-memory cache and rate-limiting store.
   - **Serverless Redis HTTP (SRH)** (host `127.0.0.1:8079`): Local HTTP adapter emulating Upstash Redis REST API.
   - Docker **never** builds or runs the application, Next.js server, worker, or migrations.
2. **Host Bun 1.4.2 runs applications, migrations, and seeds:**
   - Pinned consistently across projects.
   - Apps run natively on host with hot reloading via `bun run dev`.
   - Migrations and seeds execute directly against the shared infrastructure.
3. **Independent Startup & Resource Sharing (`name: local-platforms`):**
   - Both Infinitunes and Lipi own self-contained local development Compose files.
   - Running `bun run db:up` from either repository connects to and reuses the exact same running containers (`local-platforms-*`), volumes (`local_platforms_pgdata_18`, `local_platforms_redis_data`), and network (`local_platforms_net`).
   - Neither project requires the other's checkout to start infrastructure.
   - Resource-only `docker-compose.yml`, inline bootstrap config `postgres_init`, and canonical fixtures in `local-dev/fixtures.json`.

---

## Port Allocation & Bindings

All ports are strictly bound to `127.0.0.1` on the host:

| Service                   | Port             | Description                                   |
| :------------------------ | :--------------- | :-------------------------------------------- |
| **Infinitunes Web App**   | `3000`           | Host Next.js frontend & tRPC API              |
| **PostgreSQL 18**         | `127.0.0.1:5432` | Shared database (`local_platforms`)           |
| **Redis**                 | `127.0.0.1:6379` | Local Redis service                           |
| **Serverless Redis HTTP** | `127.0.0.1:8079` | Local Upstash REST API compatibility endpoint |

---

## Canonical Shared Credentials & Fixtures

All three platforms share consistent fixture credentials defined in a single discoverable source of truth:

- **JSON Fixture:** `local-dev/fixtures.json` (or via `LOCAL_DEV_CONFIG` env var)
- **TypeScript Module:** `packages/db/src/fixtures/local-dev-user.ts` (exported as `@infinitunes/db/fixtures`)

### Shared User Credentials

| Field              | Value                                  |
| :----------------- | :------------------------------------- |
| **User ID**        | `a0000000-0000-4000-8000-000000000001` |
| **Email**          | `local@example.test`                   |
| **Password**       | `LocalDev123!`                         |
| **Name**           | `Local Developer`                      |
| **Username**       | `localdev`                             |
| **Display Name**   | `localdev`                             |
| **Email Verified** | `true`                                 |

### AMA Anonymous Actor / Host Fixtures

AMA remains completely anonymous and does not use password-based authentication. Its fixture entities are deterministic:

| Role      | ID                                     | Name                    |
| :-------- | :------------------------------------- | :---------------------- |
| **Actor** | `a0000000-0000-4000-8000-000000000002` | `Anonymous Local Actor` |
| **Host**  | `a0000000-0000-4000-8000-000000000003` | `Anonymous Local Host`  |

---

## Database Sharing & Prefix Contract

### Shared User Table (`public.user`)

- Infinitunes and Lipi share the exact same physical `public.user` table in the `local_platforms` database.
- Better Auth credentials stored in `better_auth_account` link to `public.user.id`.
- Sibling apps authenticate against the shared user row. Sharing the user row does **not** assume shared browser sessions; each application manages its own sessions cleanly.

### Application Table Prefixing

To prevent entity collisions within the shared database:

- **Infinitunes:** Tables are prefixed with `infinitunes_` (e.g. `infinitunes_playlist`, `infinitunes_favorite`, `infinitunes_passkey`).
- **Lipi:** Tables are prefixed with `lipi_` (e.g. `lipi_*`, `lipi_passkey`).
- **AMA:** Schema-isolated / prefixed entities (`ama_*`).

---

## Quickstart Guide

### 1. Prerequisites

- **Bun 1.4.2** (`bun --version`)
- **Docker & Docker Compose**

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default connection values in `.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgrespassword@127.0.0.1:5432/local_platforms
UPSTASH_REDIS_REST_URL=http://127.0.0.1:8079
UPSTASH_REDIS_REST_TOKEN=localdevtoken
AUTH_SECRET=local-development-secret-must-be-at-least-32-chars-long
AUTH_URL=http://localhost:3000
```

### 3. Start Infrastructure

Start PostgreSQL, Redis, and the Redis REST adapter:

```bash
bun run db:up
# Or using Makefile:
make db-up
```

Verify containers are healthy:

```bash
docker compose ps
```

### 4. Run Migrations

Run Drizzle ORM migrations against the local database:

```bash
bun run db:migrate
# Or using Makefile:
make db-migrate
```

### 5. Seed Deterministic Data

Seed the canonical shared user and deterministic playlists/favorites:

```bash
bun run db:seed
# Or using Makefile:
make db-seed
```

The seed script is **idempotent**: running it multiple times preserves existing records and keeps record counts stable. It contains strict local-only safety guards refusing to run if `NODE_ENV=production`.

### 6. Start the App on Host

Start the Next.js development server:

```bash
bun run dev
# Or using Makefile:
make dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:

- **Email:** `local@example.test`
- **Password:** `LocalDev123!`

---

## Standard Commands Reference

| Command              | Makefile Alias    | Description                                            |
| :------------------- | :---------------- | :----------------------------------------------------- |
| `bun run db:up`      | `make db-up`      | Start local Docker infrastructure (PostgreSQL & Redis) |
| `bun run db:down`    | `make db-down`    | Stop local Docker infrastructure                       |
| `bun run db:migrate` | `make db-migrate` | Apply schema migrations to local database              |
| `bun run db:seed`    | `make db-seed`    | Seed deterministic test user and application data      |
| `bun run dev`        | `make dev`        | Start development server on host Bun                   |
| `bun run build`      | `make build`      | Build application for production                       |
| `bun run test`       | `make test`       | Run test suite                                         |
| `bun run type-check` | `make typecheck`  | Run TypeScript type checks                             |
| `bun run lint`       | `make lint`       | Run linter and formatting checks                       |

---

## Safe Reset Limits & Volume Preservation

- **Do NOT run global `docker system prune` or delete volumes.**
- Data lives in `local_platforms_pgdata_18` and `local_platforms_redis_data`. Docker volumes created by earlier setups (for example `infinitunes_infinitunes_pgdata_18`, any PostgreSQL 17 volume) are left untouched and are **not** adopted automatically: PostgreSQL 18 cannot open PG17 data, so move old data with `pg_dump` / restore yourself if you need it.
- There is no reset command. The shared database also holds Lipi (`lipi_*`) and the shared auth tables, so a blanket drop would remove their data too. To start clean, stop the stack (`bun run db:down`) and remove the named volumes yourself, deliberately and only once you are sure nothing in them is needed.
- `bun run db:seed` only runs against a loopback `DATABASE_URL` host (`localhost`, `127.0.0.1`, `::1`; a `host=` query parameter is refused) and never with `NODE_ENV=production`. It inserts only the canonical fixture user in one transaction and aborts, writing nothing, if that id or email already belongs to a different account. It never attaches the documented password to an existing account, and re-running it adds no rows.
- `LOCAL_DEV_CONFIG` is optional. When set it must point to an existing, schema-valid fixture JSON; anything else is an error, not a fallback.
