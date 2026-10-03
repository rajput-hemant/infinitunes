import { Mic2 } from "lucide-react";

import {
  LibraryEmpty,
  LibraryHeading,
  LibraryUnavailable,
} from "~/components/library/library-section";
import { SliderCard } from "~/components/slider/slider-card";
import { getUserFavorites } from "~/lib/db/queries";
import { api } from "~/lib/trpc/server";

export const metadata = {
  title: "Liked Artists",
  description: "Your favorite artists in one place.",
};

export default async function LikedArtistsPage() {
  const favorites = await getUserFavorites();
  const tokens = [...new Set(favorites?.artists ?? [])];

  if (tokens.length) {
    const settled = await Promise.allSettled(
      tokens.map((token) => api.artist.details({ id: token })),
    );
    const artists = settled.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );

    if (artists.length) {
      return (
        <div className="space-y-4">
          <LibraryHeading
            title="Liked Artists"
            count={artists.length}
            noun="artist"
            missing={tokens.length - artists.length}
          />

          <div className="flex w-full flex-wrap gap-4">
            {artists.map((artist) => (
              <SliderCard
                key={artist.artistId}
                name={artist.name}
                url={artist.urls.songs}
                subtitle={artist.subtitle}
                type={artist.type}
                image={artist.image}
              />
            ))}
          </div>
        </div>
      );
    }
  }

  if (tokens.length) return <LibraryUnavailable what="liked artists" />;

  return (
    <LibraryEmpty
      icon={Mic2}
      title="No liked artists yet"
      description="Tap the heart on an artist and it will show up here."
      action={{ href: "/artist", label: "Browse Artists" }}
    />
  );
}
