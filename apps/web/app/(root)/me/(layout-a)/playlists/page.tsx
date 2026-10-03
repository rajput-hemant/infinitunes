import { ListMusic } from "lucide-react";

import {
  LibraryEmpty,
  LibraryHeading,
  LibraryUnavailable,
} from "~/components/library/library-section";
import { SliderCard } from "~/components/slider/slider-card";
import { getUserFavorites } from "~/lib/db/queries";
import { api } from "~/lib/trpc/server";

export const metadata = {
  title: "Liked Playlists",
  description: "Your favorite playlists in one place.",
};

export default async function LikedPlaylistsPage() {
  const favorites = await getUserFavorites();
  const tokens = [...new Set(favorites?.playlists ?? [])];

  if (tokens.length) {
    const settled = await Promise.allSettled(
      tokens.map((token) => api.playlist.details({ id: token })),
    );
    const playlists = settled.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );

    if (playlists.length) {
      return (
        <div className="space-y-4">
          <LibraryHeading
            title="Liked Playlists"
            count={playlists.length}
            noun="playlist"
            missing={tokens.length - playlists.length}
          />

          <div className="flex w-full flex-wrap gap-4">
            {playlists.map((playlist) => (
              <SliderCard
                key={playlist.id}
                name={playlist.title}
                url={playlist.perma_url}
                subtitle={playlist.subtitle}
                type={playlist.type}
                image={playlist.image}
                explicit={playlist.explicit_content}
              />
            ))}
          </div>
        </div>
      );
    }
  }

  if (tokens.length) return <LibraryUnavailable what="liked playlists" />;

  return (
    <LibraryEmpty
      icon={ListMusic}
      title="No liked playlists yet"
      description="Tap the heart on a playlist and it will show up here."
      action={{ href: "/playlist", label: "Browse Playlists" }}
    />
  );
}
