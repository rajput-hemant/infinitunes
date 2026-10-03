import { History } from "lucide-react";

import {
  LibraryEmpty,
  LibraryHeading,
  LibraryUnavailable,
} from "~/components/library/library-section";
import { PlayAllButton } from "~/components/library/play-all-button";
import { SongList } from "~/components/song-list/song-list";
import { fetchSongsChunked } from "~/lib/liked-songs";
import { api } from "~/lib/trpc/server";

export const metadata = {
  title: "Recently Played",
  description: "Songs you listened to lately.",
};

export default async function RecentlyPlayedPage() {
  const history = await api.history.list();
  const ids = history.filter((item) => item.type === "song").map((i) => i.id);

  if (!ids.length) {
    return (
      <LibraryEmpty
        icon={History}
        title="Nothing played yet"
        description="Songs you listen to will show up here, newest first."
        action={{ href: "/", label: "Find Something to Play" }}
      />
    );
  }

  const fetched = await fetchSongsChunked(ids, (input) =>
    api.song.details(input),
  );

  if (!fetched) return <LibraryUnavailable what="recently played songs" />;

  const byId = new Map(fetched.map((song) => [song.id, song]));
  const songs = ids.flatMap((id) => byId.get(id) ?? []);

  return (
    <div className="space-y-4">
      <LibraryHeading
        title="Recently Played"
        count={songs.length}
        noun="song"
        missing={ids.length - songs.length}
      >
        <PlayAllButton items={songs} />
      </LibraryHeading>

      <SongList items={songs} />
    </div>
  );
}
