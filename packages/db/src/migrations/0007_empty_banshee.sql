DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'password'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM "user" u
      WHERE u."password" IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM "better_auth_account" b
        WHERE b."userId" = u."id" AND b."providerId" = 'credential'
          AND b."accountId" = u."id"::text AND b."password" IS NOT NULL
      )
    ) THEN
      RAISE EXCEPTION 'Migration 0007 blocked: legacy user passwords have not been migrated to Better Auth. Migrate with the previous release first.';
    END IF;
  END IF;

  IF to_regclass('public.account') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM "account" a WHERE NOT EXISTS (
        SELECT 1 FROM "better_auth_account" b
        WHERE b."userId" = a."userId" AND b."providerId" = a."provider"
          AND b."accountId" = a."providerAccountId"
      )
    ) THEN
      RAISE EXCEPTION 'Migration 0007 blocked: legacy accounts have not been migrated to Better Auth. Migrate with the previous release first.';
    END IF;
  END IF;

  IF to_regclass('public."verificationToken"') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM "verificationToken" v WHERE NOT EXISTS (
        SELECT 1 FROM "better_auth_verification" b
        WHERE b."identifier" = v."identifier" AND b."value" = v."token"
          AND b."expiresAt" = v."expires"
      )
    ) THEN
      RAISE EXCEPTION 'Migration 0007 blocked: legacy verification tokens have not been migrated to Better Auth. Migrate with the previous release first.';
    END IF;
  END IF;
END $$;
--> statement-breakpoint
DROP TABLE IF EXISTS "account" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "verificationToken" CASCADE;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "emailVerified";
