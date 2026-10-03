# Infinitunes Shared Local Development & Schema Compatibility Report

**Repository Head:** `fm/infinitunes-shared-local-dev` (incorporates `b4cc30f` onto `migration/bun-monorepo`)  
**Status:** Authoritative Shared Infrastructure Owner (Resource-only Compose, Bootstrap SQL, Shared Fixtures, Documentation)

---

## 1. Canonical Shared Fixtures & Contract

All projects consume this single canonical fixture via the documented environment variable `LOCAL_DEV_CONFIG`.

- **Canonical JSON Path:** `local-dev/fixtures.json` (also tracked at `config/local-dev-fixture.json` and mirrored in `@infinitunes/db/fixtures`)
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

## 2. Shared `user` & Auth Table DDL

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

## 3. Table Prefixing & Schema Isolation

- **Infinitunes Tables:** `infinitunes_*`
  - `infinitunes_playlist`
  - `infinitunes_favorite`
  - `infinitunes_passkey`
- **Lipi Tables:** `lipi_*`
  - `lipi_workspaces`, `lipi_collaborators`, `lipi_documents`, `lipi_accounts`, etc.
- **AMA Tables:** `ama_*` / schema-isolated entities.
- **Collision Risk:** Zero. All application-specific tables use dedicated prefixes.

---

## 4. Migration Ownership & Execution Order

### The Migration Problem & Resolution

- **Infinitunes owns the shared base DDL:** Its `0000_baseline.sql` creates `user`, `account`, `verificationToken`, `better_auth_account`, `better_auth_session`, `better_auth_verification`, `infinitunes_favorite`, `infinitunes_playlist`.
- **Migration History Isolation:**
  - Infinitunes uses the default `drizzle.__drizzle_migrations` history table.
  - Lipi uses a dedicated history table `drizzle.__lipi_migrations` for local development.
- **Execution Order:**
  1. **Start Infrastructure:** `docker compose up -d` (starts PostgreSQL, Redis, Redis-REST).
  2. **Step 1 - Infinitunes Migrate:** `bun run db:migrate` in Infinitunes. This applies the shared baseline and creates the `user` and `better_auth_*` tables.
  3. **Step 2 - Lipi Migrate:** `bun run db:migrate` in Lipi. This runs against `drizzle.__lipi_migrations` and creates all `lipi_*` application tables without clashing on migration timestamps.
  4. **Step 3 - Seed:** Run `bun run db:seed` in each app. The seed is idempotent and safely updates/preserves the shared user.

---

## 5. Shared Infrastructure Compose Specification

- **File:** `docker-compose.yml` (Infinitunes repository)
- **Services:**
  - `postgres`: Image `postgres:18.6-alpine`, port `127.0.0.1:5432:5432`, DB `local_platforms`, user `postgres`, password `postgrespassword`. Data volume `infinitunes_pgdata_18` mounted at `/var/lib/postgresql`.
  - `redis`: Image `redis:7-alpine`, port `127.0.0.1:6379:6379`.
  - `redis-rest`: Image `hiett/serverless-redis-http:latest`, port `127.0.0.1:8079:80`.
- **Host Binding:** `127.0.0.1` only for security and isolation.
- **Bootstrap Script:** `docker/bootstrap/01-init.sql` creates extensions `pgcrypto` and `uuid-ossp` on `local_platforms`.
