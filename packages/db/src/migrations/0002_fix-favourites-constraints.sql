ALTER TABLE "infinitunes_favorite" DROP CONSTRAINT "infinitunes_favorite_songs_unique";--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" DROP CONSTRAINT "infinitunes_favorite_albums_unique";--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" DROP CONSTRAINT "infinitunes_favorite_playlists_unique";--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" DROP CONSTRAINT "infinitunes_favorite_artists_unique";--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" DROP CONSTRAINT "infinitunes_favorite_podcasts_unique";--> statement-breakpoint
ALTER TABLE "infinitunes_favorite" ADD CONSTRAINT "infinitunes_favorite_userId_unique" UNIQUE("userId");