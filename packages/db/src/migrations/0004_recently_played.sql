CREATE TABLE "infinitunes_recently_played" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"itemId" text NOT NULL,
	"itemType" text NOT NULL,
	"playedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "infinitunes_recently_played" ADD CONSTRAINT "infinitunes_recently_played_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "infinitunes_recently_played_user_item_unique" ON "infinitunes_recently_played" USING btree ("userId","itemType","itemId");--> statement-breakpoint
CREATE INDEX "infinitunes_recently_played_user_played_at_idx" ON "infinitunes_recently_played" USING btree ("userId","playedAt" DESC NULLS LAST);