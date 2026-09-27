import { decode } from "@infinitunes/types";
import { Ghost } from "lucide-react";

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
          <h2 className="font-heading text-xl drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
            Liked Playlists
          </h2>

          <div className="flex w-full flex-wrap gap-4">
            {playlists.map((playlist) => (
              <SliderCard
                key={playlist.id}
                name={decode(playlist.title)}
                url={playlist.perma_url}
                subtitle={decode(playlist.subtitle)}
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

  return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-md border border-dashed lg:h-100">
      <Ghost size={64} />

      <h3 className="py-6 text-center font-heading text-xl drop-shadow-md sm:text-2xl md:text-3xl">
        Nothing here yet. <br /> Like some playlists to see them here.
      </h3>
    </div>
  );
}
