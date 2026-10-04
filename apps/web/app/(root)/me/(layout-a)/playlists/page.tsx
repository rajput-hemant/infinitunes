import { ListMusic } from "lucide-react";

import { getUserFavorites } from "~/lib/db/queries";
import { api } from "~/lib/trpc/server";

import { LikedCollection } from "../_components/liked-collection";

export const metadata = {
  title: "Liked Playlists",
  description: "Your favorite playlists in one place.",
};

export default async function LikedPlaylistsPage() {
  const favorites = await getUserFavorites();

  return (
    <LikedCollection
      tokens={favorites?.playlists ?? []}
      noun="playlist"
      fetchItem={(token) => api.playlist.details({ id: token })}
      toCard={(playlist) => ({
        name: playlist.title,
        url: playlist.perma_url,
        subtitle: playlist.subtitle,
        type: playlist.type,
        image: playlist.image,
        explicit: playlist.explicit_content,
      })}
      empty={{
        icon: ListMusic,
        description: "Tap the heart on a playlist and it will show up here.",
        action: { href: "/playlist", label: "Browse Playlists" },
      }}
    />
  );
}
