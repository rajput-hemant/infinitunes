-- Replace array uniqueness with temporary id uniqueness so merged lists can match other users' lists.
ALTER TABLE "infinitunes_favorite" DROP CONSTRAINT "infinitunes_favorite_songs_unique";--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" DROP CONSTRAINT "infinitunes_favorite_albums_unique";--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" DROP CONSTRAINT "infinitunes_favorite_playlists_unique";--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" DROP CONSTRAINT "infinitunes_favorite_artists_unique";--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" DROP CONSTRAINT "infinitunes_favorite_podcasts_unique";--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" ADD CONSTRAINT "infinitunes_favorite_songs_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" ADD CONSTRAINT "infinitunes_favorite_albums_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" ADD CONSTRAINT "infinitunes_favorite_playlists_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" ADD CONSTRAINT "infinitunes_favorite_artists_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" ADD CONSTRAINT "infinitunes_favorite_podcasts_unique" UNIQUE("id");--> statement-breakpoint
UPDATE "infinitunes_favorite" AS keeper
SET
	"songs" = ARRAY(SELECT DISTINCT token FROM "infinitunes_favorite" AS source CROSS JOIN LATERAL unnest(source."songs") AS item(token) WHERE source."userId" = keeper."userId" ORDER BY token),
	"albums" = ARRAY(SELECT DISTINCT token FROM "infinitunes_favorite" AS source CROSS JOIN LATERAL unnest(source."albums") AS item(token) WHERE source."userId" = keeper."userId" ORDER BY token),
	"playlists" = ARRAY(SELECT DISTINCT token FROM "infinitunes_favorite" AS source CROSS JOIN LATERAL unnest(source."playlists") AS item(token) WHERE source."userId" = keeper."userId" ORDER BY token),
	"artists" = ARRAY(SELECT DISTINCT token FROM "infinitunes_favorite" AS source CROSS JOIN LATERAL unnest(source."artists") AS item(token) WHERE source."userId" = keeper."userId" ORDER BY token),
	"podcasts" = ARRAY(SELECT DISTINCT token FROM "infinitunes_favorite" AS source CROSS JOIN LATERAL unnest(source."podcasts") AS item(token) WHERE source."userId" = keeper."userId" ORDER BY token)
WHERE keeper."id" = (SELECT row."id" FROM "infinitunes_favorite" AS row WHERE row."userId" = keeper."userId" ORDER BY row."id" LIMIT 1)
	AND EXISTS (SELECT 1 FROM "infinitunes_favorite" AS duplicate WHERE duplicate."userId" = keeper."userId" AND duplicate."id" <> keeper."id");--> statement-breakpoint
DELETE FROM "infinitunes_favorite" AS duplicate
USING "infinitunes_favorite" AS keeper
WHERE duplicate."userId" = keeper."userId" AND duplicate."id" > keeper."id";
