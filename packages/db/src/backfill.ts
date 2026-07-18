/* ---------------------------------------------------------------------------
 * Backfill: migrate existing Auth.js data into Better Auth tables.
 *
 * These are idempotent SQL blocks (NOT EXISTS guarded) meant to be run
 * AFTER the additive migration (0007) has created the target tables.
 * ------------------------------------------------------------------------- */

/**
 * Backfill Better Auth accounts from the legacy Auth.js `account` table.
 *
 * Provider mapping:
 *   Auth.js "provider"              → Better Auth "providerId"
 *   Auth.js "providerAccountId"     → Better Auth "accountId"
 *   Auth.js "access_token"          → Better Auth "accessToken"
 *   Auth.js "refresh_token"         → Better Auth "refreshToken"
 *   Auth.js "expires_at" (epoch)    → Better Auth "accessTokenExpiresAt"
 *   Auth.js "scope"                 → Better Auth "scope"
 *   Auth.js "id_token"              → Better Auth "idToken"
 */
export const BACKFILL_OAUTH_ACCOUNTS = `
INSERT INTO "better_auth_account" (
  "id",
  "userId",
  "accountId",
  "providerId",
  "accessToken",
  "refreshToken",
  "accessTokenExpiresAt",
  "scope",
  "idToken",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  "userId",
  "providerAccountId",
  "provider",
  "access_token",
  "refresh_token",
  CASE
    WHEN "expires_at" IS NOT NULL
    THEN to_timestamp("expires_at")::timestamp
    ELSE NULL
  END,
  "scope",
  "id_token",
  NOW(),
  NOW()
FROM "account"
WHERE NOT EXISTS (
  SELECT 1
  FROM "better_auth_account" b
  WHERE b."userId" = "account"."userId"
    AND b."providerId" = "account"."provider"
    AND b."accountId" = "account"."providerAccountId"
);
`;

/**
 * Backfill Better Auth verification records from the legacy
 * `verificationToken` table, copying only unexpired records.
 */
export const BACKFILL_VERIFICATION_TOKENS = `
INSERT INTO "better_auth_verification" (
  "id",
  "identifier",
  "value",
  "expiresAt",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  "identifier",
  "token",
  "expires",
  NOW(),
  NOW()
FROM "verificationToken"
WHERE "expires" > NOW()
  AND NOT EXISTS (
    SELECT 1
    FROM "better_auth_verification" b
    WHERE b."identifier" = "verificationToken"."identifier"
      AND b."value" = "verificationToken"."token"
  );
`;

/**
 * Create Better Auth account entries for users who signed up via
 * credentials (email/username + bcrypt password).  The accountId
 * is set to the user's UUID to match Better Auth's credential
 * provider convention.
 */
export const BACKFILL_CREDENTIAL_ACCOUNTS = `
INSERT INTO "better_auth_account" (
  "id",
  "userId",
  "accountId",
  "providerId",
  "password",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  u."id",
  u."id",
  'credential',
  u."password",
  NOW(),
  NOW()
FROM "user" u
WHERE u."password" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "better_auth_account" b
    WHERE b."userId" = u."id"
      AND b."providerId" = 'credential'
  );
`;

/**
 * Convenience: run all three backfill statements in the recommended order.
 */
export const BACKFILL_ALL = [
  BACKFILL_OAUTH_ACCOUNTS,
  BACKFILL_VERIFICATION_TOKENS,
  BACKFILL_CREDENTIAL_ACCOUNTS,
].join("\n--> statement-breakpoint\n");
