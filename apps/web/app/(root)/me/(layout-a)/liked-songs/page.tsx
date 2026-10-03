import { Heart } from "lucide-react";

import {
  LibraryEmpty,
  LibraryHeading,
  LibraryUnavailable,
} from "~/components/library/library-section";
import { PlayAllButton } from "~/components/library/play-all-button";
import { SongList } from "~/components/song-list/song-list";
import { getUserFavorites } from "~/lib/db/queries";
import { fetchSongsChunked } from "~/lib/liked-songs";
import { api } from "~/lib/trpc/server";

export const metadata = {
  title: "Liked Songs",
  description: "Your favorite songs in one place.",
};

export default async function LikedSongsPage() {
  const favoriteSongs = await getUserFavorites();

  if (favoriteSongs && favoriteSongs.songs.length) {
    const songs = await fetchSongsChunked(favoriteSongs.songs, (input) =>
      api.song.details(input),
    );

    if (!songs) return <LibraryUnavailable what="liked songs" />;

    return (
      <div className="space-y-4">
        <LibraryHeading
          title="Liked Songs"
          count={songs.length}
          noun="song"
          missing={favoriteSongs.songs.length - songs.length}
        >
          <PlayAllButton items={songs} />
        </LibraryHeading>

        <SongList items={songs} />
      </div>
    );
  }

  return (
    <LibraryEmpty
      icon={Heart}
      title="No liked songs yet"
      description="Tap the heart on any song and it will show up here."
      action={{ href: "/chart", label: "Browse Top Charts" }}
    />
  );
}
