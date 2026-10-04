import { Disc3 } from "lucide-react";

import { getUserFavorites } from "~/lib/db/queries";
import { api } from "~/lib/trpc/server";

import { LikedCollection } from "../_components/liked-collection";

export const metadata = {
  title: "Liked Albums",
  description: "Your favorite albums in one place.",
};

export default async function LikedAlbumsPage() {
  const favorites = await getUserFavorites();

  return (
    <LikedCollection
      tokens={favorites?.albums ?? []}
      noun="album"
      fetchItem={(token) => api.album.details({ id: token })}
      toCard={(album) => ({
        name: album.title,
        url: album.perma_url,
        subtitle: album.subtitle,
        type: album.type,
        image: album.image,
        explicit: album.explicit_content,
      })}
      empty={{
        icon: Disc3,
        description: "Tap the heart on an album and it will show up here.",
        action: { href: "/album", label: "Browse Albums" },
      }}
    />
  );
}
