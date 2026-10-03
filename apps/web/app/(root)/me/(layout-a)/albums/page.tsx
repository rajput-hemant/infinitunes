import { decode } from "@infinitunes/types";
import { Disc3 } from "lucide-react";

import {
  LibraryEmpty,
  LibraryHeading,
  LibraryUnavailable,
} from "~/components/library/library-section";
import { SliderCard } from "~/components/slider/slider-card";
import { getUserFavorites } from "~/lib/db/queries";
import { api } from "~/lib/trpc/server";

export const metadata = {
  title: "Liked Albums",
  description: "Your favorite albums in one place.",
};

export default async function LikedAlbumsPage() {
  const favorites = await getUserFavorites();
  const tokens = [...new Set(favorites?.albums ?? [])];

  if (tokens.length) {
    const settled = await Promise.allSettled(
      tokens.map((token) => api.album.details({ id: token })),
    );
    const albums = settled.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );

    if (albums.length) {
      return (
        <div className="space-y-4">
          <LibraryHeading
            title="Liked Albums"
            count={albums.length}
            noun="album"
          />

          <div className="flex w-full flex-wrap gap-4">
            {albums.map((album) => (
              <SliderCard
                key={album.id}
                name={decode(album.title)}
                url={album.perma_url}
                subtitle={decode(album.subtitle)}
                type={album.type}
                image={album.image}
                explicit={album.explicit_content}
              />
            ))}
          </div>
        </div>
      );
    }
  }

  if (tokens.length) return <LibraryUnavailable what="liked albums" />;

  return (
    <LibraryEmpty
      icon={Disc3}
      title="No liked albums yet"
      description="Tap the heart on an album and it will show up here."
      action={{ href: "/album", label: "Browse Albums" }}
    />
  );
}
