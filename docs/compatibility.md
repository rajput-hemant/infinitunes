# Infinitunes Shared Local Development & Schema Compatibility Report

**Repository Head:** `fm/infinitunes-shared-local-dev` (incorporates `b4cc30f` onto `migration/bun-monorepo`)  
**Status:** Shared Infrastructure Owner & Canonical Local Setup

---

## 1. Multi-Project Independent Startup Contract

Both **Infinitunes** and **Lipi** maintain self-contained local development configuration files in their own repositories. A developer can run `bun run db:up` (or `docker compose up -d`) from **either** project without needing to check out or start the other.

To achieve seamless resource reuse and prevent duplicate containers or data loss, both projects share the exact same Compose identifiers:

- **Compose Project Name:** `local-platforms` (`name: local-platforms`)
- **PostgreSQL Container Name:** `local-platforms-postgres`
- **PostgreSQL Data Volume:** `local_platforms_pgdata_18` (named volume: `local_platforms_pgdata_18`)
- **Redis Container Name:** `local-platforms-redis`
- **Redis Data Volume:** `local_platforms_redis_data` (named volume: `local_platforms_redis_data`)
- **Serverless Redis HTTP Container Name:** `local-platforms-redis-rest`
- **Shared Network Name:** `local_platforms_net` (named network: `local_platforms_net`)
- **Host Loopback Bindings:**
  - PostgreSQL: `127.0.0.1:5432:5432`
  - Redis: `127.0.0.1:6379:6379`
  - Serverless Redis HTTP: `127.0.0.1:8079:80`

### Cross-Checkout Startup Reuse Verification

Because the project name, container names, volume names, and network name are explicitly pinned:

1. Running `bun run db:up` in Infinitunes launches `local-platforms-*`.
2. Running `bun run db:up` in Lipi targets the exact same project and containers, reusing the active PostgreSQL and Redis instances without conflict.
3. Neither repository depends on file paths or checkouts of the sibling repository.

---

## 2. Canonical Shared Fixtures & Contract

Each repository maintains its own local copy of the canonical fixture at `local-dev/fixtures.json` (or reads a custom path via `LOCAL_DEV_CONFIG`).

- **Shared Database Name:** `local_platforms`
- **Default Database URL:** `postgresql://postgres:postgrespassword@127.0.0.1:5432/local_platforms`
- **Local Redis Host & Port:** `127.0.0.1:6379`
- **Local Serverless Redis HTTP (Upstash REST emulator):** `http://127.0.0.1:8079` (Token: `localdevtoken`)

### Shared User Credentials

| Field                 | Value                                  | Notes                                             |
| :-------------------- | :------------------------------------- | :------------------------------------------------ |
| **`id`**              | `a0000000-0000-4000-8000-000000000001` | Fixed UUID v4 across Infinitunes & Lipi           |
| **`email`**           | `local@example.test`                   | Canonical local development email                 |
| **`password`**        | `LocalDev123!`                         | Plaintext password                                |
| **`name`**            | `Local Developer`                      | Mirrored to `user.name` and `user.betterAuthName` |
| **`betterAuthName`**  | `Local Developer`                      | Better Auth mapped name                           |
| **`username`**        | `localdev`                             | Mapped presentation username                      |
| **`displayUsername`** | `localdev`                             | Mapped display username                           |
| **`emailVerified`**   | `true`                                 | Mapped to `emailVerifiedBoolean: true`            |

### AMA Anonymous Actor / Host Fixtures (No Password Login)

| Role      | Deterministic UUID                     | Name                    |
| :-------- | :------------------------------------- | :---------------------- |
| **Actor** | `a0000000-0000-4000-8000-000000000002` | `Anonymous Local Actor` |
| **Host**  | `a0000000-0000-4000-8000-000000000003` | `Anonymous Local Host`  |

AMA entities remain anonymous and isolated; no credential login is created or needed for AMA.

---

## 3. Shared `user` & Auth Table DDL

Infinitunes and Lipi share the exact same physical `public.user` table and Better Auth tables.

### `public.user` Table

```sql
CREATE TABLE "user" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text,
    "email" text NOT NULL,
    "username" text,
    "password" text,
    "emailVerified" timestamp,
    "image" text,
    "betterAuthName" text DEFAULT '' NOT NULL,
    "emailVerifiedBoolean" boolean DEFAULT false NOT NULL,
    "displayUsername" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "user_email_unique" UNIQUE("email"),
    CONSTRAINT "user_username_unique" UNIQUE("username")
);
```

### Core Shared Auth Tables (Unprefixed)

1. **`better_auth_account`**:
   - `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `userId`: `uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE`
   - `accountId`: `text NOT NULL` (**Note:** Set to `user.id` for `providerId: 'credential'`)
   - `providerId`: `text NOT NULL` (`'credential'`)
   - `password`: `text` (Bcrypt cost 10 hash of fixture password)
   - Unique index: `better_auth_account_provider_account_unique (providerId, accountId)`
2. **`better_auth_session`**:
   - `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `userId`: `uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE`
   - `token`: `text NOT NULL UNIQUE`
   - `expiresAt`: `timestamp NOT NULL`
3. **`better_auth_verification`**:
   - `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `identifier`: `text NOT NULL`
   - `value`: `text NOT NULL`
   - `expiresAt`: `timestamp NOT NULL`
4. **Legacy Auth Tables**:
   - `account` (`userId`, `type`, `provider`, `providerAccountId`, tokens)
   - `verificationToken` (`identifier`, `token`, `expires`)

### Shared Password & Session Characteristics

- **Bcrypt Cost 10:** Both Infinitunes and Lipi use `bcryptjs` with cost 10 (`hash(password, 10)`). A single seeded credential row in `better_auth_account` allows login in both apps with `local@example.test` and `LocalDev123!`.
- **Session Cookies:** Better Auth cookies on `localhost` are shared across ports if signed with the same `AUTH_SECRET`. We recommend documenting identical local `AUTH_SECRET` or isolated browser tabs.

---

## 4. Table Prefixing & Schema Isolation

- **Infinitunes Tables:** `infinitunes_*`
  - `infinitunes_playlist`
  - `infinitunes_favorite`
  - `infinitunes_passkey`
- **Lipi Tables:** `lipi_*`
  - `lipi_workspaces`, `lipi_collaborators`, `lipi_documents`, `lipi_accounts`, etc.
- **AMA Tables:** `ama_*` / schema-isolated entities.
- **Collision Risk:** Zero. All application-specific tables use dedicated prefixes.

---

## 5. Migration Ownership & Execution Order

### The Migration Problem & Resolution

- **Infinitunes owns the shared base DDL:** Its `0000_baseline.sql` creates `user`, `account`, `verificationToken`, `better_auth_account`, `better_auth_session`, `better_auth_verification`, `infinitunes_favorite`, `infinitunes_playlist`.
- **Migration History Isolation:**
  - Infinitunes uses the default `drizzle.__drizzle_migrations` history table.
  - Lipi uses a dedicated history table `drizzle.__lipi_migrations` for local development.
- **Execution Order:**
  1. **Start Infrastructure:** `bun run db:up` (either repo).
  2. **Step 1 - Infinitunes Migrate:** `bun run db:migrate` in Infinitunes. This applies the shared baseline and creates the `user` and `better_auth_*` tables.
  3. **Step 2 - Lipi Migrate:** `bun run db:migrate` in Lipi. This runs against `drizzle.__lipi_migrations` and creates all `lipi_*` application tables without clashing on migration timestamps.
  4. **Step 3 - Seed:** Run `bun run db:seed` in each app. The seed is idempotent and safely updates/preserves the shared user.

---

## 6. Shared Infrastructure Compose Specification

- **File:** `docker-compose.yml` (self-contained in both repos)
- **Top-level Name:** `name: local-platforms`
- **Services:**
  - `postgres`: Image `postgres:18.6-alpine`, port `127.0.0.1:5432:5432`, DB `local_platforms`, user `postgres`, password `postgrespassword`. Data volume `local_platforms_pgdata_18` mounted at `/var/lib/postgresql`.
  - `redis`: Image `redis:7.4-alpine`, port `127.0.0.1:6379:6379`.
  - `redis-rest`: Image `hiett/serverless-redis-http:0.0.10`, port `127.0.0.1:8079:80`.
- **Host Binding:** `127.0.0.1` only for loopback isolation.
- **Bootstrap Init:** Inline Compose configuration (`configs: postgres_init`) initializes extensions `pgcrypto` and `uuid-ossp` on `local_platforms` without repository path dependencies.
