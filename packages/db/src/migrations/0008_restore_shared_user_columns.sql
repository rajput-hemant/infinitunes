ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password" text;
