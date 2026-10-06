import { History } from "lucide-react";

import {
  LibraryEmpty,
  LibraryHeading,
  LibraryUnavailable,
} from "~/components/library/library-section";
import { LibrarySongList } from "~/components/library/library-song-list";
import { PlayAllButton } from "~/components/library/play-all-button";
import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { fetchSongsChunked, orderByIds } from "~/lib/liked-songs";
import { api } from "~/lib/trpc/server";

export const metadata = {
  title: "Recently Played",
  description: "Songs and episodes you listened to lately.",
};

export default async function RecentlyPlayedPage() {
  const history = await api.history.list();
  const ids = history.map((item) => item.id);

  if (!ids.length) {
    return (
      <LibraryEmpty
        icon={History}
        title="Nothing played yet"
        description="Songs and episodes you listen to will show up here, newest first."
        action={{ href: "/", label: "Find Something to Play" }}
      />
    );
  }

  const fetched = await fetchSongsChunked(ids, (input) =>
    api.song.items(input),
  );

  if (!fetched) return <LibraryUnavailable what="recently played items" />;

  const items = orderByIds(ids, fetched);

  const user = await getUser();
  const [playlists, favorites] = user
    ? await Promise.all([getUserPlaylists(), getUserFavorites()])
    : [undefined, undefined];

  return (
    <div className="space-y-4">
      <LibraryHeading
        title="Recently Played"
        count={items.length}
        noun="item"
        missing={ids.length - items.length}
      >
        <PlayAllButton items={items} />
      </LibraryHeading>

      <LibrarySongList
        user={user}
        items={items}
        userFavorites={favorites}
        userPlaylists={playlists}
      />
    </div>
  );
}
