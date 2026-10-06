import { Heart } from "lucide-react";

import {
  LibraryEmpty,
  LibraryHeading,
  LibraryUnavailable,
} from "~/components/library/library-section";
import { LibrarySongList } from "~/components/library/library-song-list";
import { PlayAllButton } from "~/components/library/play-all-button";
import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { fetchSongsChunked } from "~/lib/liked-songs";
import { api } from "~/lib/trpc/server";

export const metadata = {
  title: "Liked Songs",
  description: "Your favorite songs in one place.",
};

export default async function LikedSongsPage() {
  const [user, favoriteSongs] = await Promise.all([
    getUser(),
    getUserFavorites(),
  ]);

  if (favoriteSongs && favoriteSongs.songs.length) {
    const songs = await fetchSongsChunked(favoriteSongs.songs, (input) =>
      api.song.details(input),
    );

    if (!songs) return <LibraryUnavailable what="liked songs" />;

    const playlists = user ? await getUserPlaylists() : undefined;

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

        <LibrarySongList
          user={user}
          items={songs}
          userFavorites={favoriteSongs}
          userPlaylists={playlists}
        />
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
