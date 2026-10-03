import { Mic2 } from "lucide-react";

import { getUserFavorites } from "~/lib/db/queries";
import { api } from "~/lib/trpc/server";

import { LikedCollection } from "../_components/liked-collection";

export const metadata = {
  title: "Liked Artists",
  description: "Your favorite artists in one place.",
};

export default async function LikedArtistsPage() {
  const favorites = await getUserFavorites();

  return (
    <LikedCollection
      tokens={favorites?.artists ?? []}
      noun="artist"
      fetchItem={(token) => api.artist.details({ id: token })}
      toCard={(artist) => ({
        name: artist.name,
        url: artist.urls.songs,
        subtitle: artist.subtitle,
        type: artist.type,
        image: artist.image,
      })}
      empty={{
        icon: Mic2,
        description: "Tap the heart on an artist and it will show up here.",
        action: { href: "/artist", label: "Browse Artists" },
      }}
    />
  );
}
