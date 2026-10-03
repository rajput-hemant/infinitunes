import { Heart } from "lucide-react";

import {
  LibraryEmpty,
  LibraryHeading,
  LibraryUnavailable,
} from "~/components/library/library-section";
import { PlayAllButton } from "~/components/library/play-all-button";
import { SongList } from "~/components/song-list/song-list";
import { getUserFavorites } from "~/lib/db/queries";
import { api } from "~/lib/trpc/server";

export const metadata = {
  title: "Liked Songs",
  description: "Your favorite songs in one place.",
};

export default async function LikedSongsPage() {
  const favoriteSongs = await getUserFavorites();

  if (favoriteSongs && favoriteSongs.songs.length) {
    const songsDetails = await api.song
      .details({ id: favoriteSongs.songs.join(",") })
      .catch(() => undefined);

    if (!songsDetails) return <LibraryUnavailable what="liked songs" />;

    return (
      <div className="space-y-4">
        <LibraryHeading
          title="Liked Songs"
          count={songsDetails.songs.length}
          noun="song"
        >
          <PlayAllButton items={songsDetails.songs} />
        </LibraryHeading>

        <SongList items={songsDetails.songs} />
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
