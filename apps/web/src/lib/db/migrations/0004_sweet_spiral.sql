CREATE TABLE IF NOT EXISTS "infinitunes_favorite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"songs" text[] DEFAULT '{}' NOT NULL,
	"albums" text[] DEFAULT '{}' NOT NULL,
	"playlists" text[] DEFAULT '{}' NOT NULL,
	"artists" text[] DEFAULT '{}' NOT NULL,
	"podcasts" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "infinitunes_favorite_songs_unique" UNIQUE("songs"),
	CONSTRAINT "infinitunes_favorite_albums_unique" UNIQUE("albums"),
	CONSTRAINT "infinitunes_favorite_playlists_unique" UNIQUE("playlists"),
	CONSTRAINT "infinitunes_favorite_artists_unique" UNIQUE("artists"),
	CONSTRAINT "infinitunes_favorite_podcasts_unique" UNIQUE("podcasts")
);
--> statement-breakpoint
ALTER TABLE "infinitunes_playlist" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "infinitunes_favorite" ADD CONSTRAINT "infinitunes_favorite_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
