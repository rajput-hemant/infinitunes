import { decode } from "@infinitunes/types";
import { Ghost } from "lucide-react";

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
          <h2 className="font-heading text-xl drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
            Liked Albums
          </h2>

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

  return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-md border border-dashed lg:h-100">
      <Ghost size={64} />

      <h3 className="py-6 text-center font-heading text-xl drop-shadow-md sm:text-2xl md:text-3xl">
        Nothing here yet. <br /> Like some albums to see them here.
      </h3>
    </div>
  );
}
