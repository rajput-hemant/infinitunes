ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_username_unique";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "username";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "displayUsername";
