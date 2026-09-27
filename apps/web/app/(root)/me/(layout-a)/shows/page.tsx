import { decode, getToken } from "@infinitunes/types";
import { Ghost } from "lucide-react";

import { SliderCard } from "~/components/slider/slider-card";
import { getUserFavorites } from "~/lib/db/queries";
import { api } from "~/lib/trpc/server";

export const metadata = {
  title: "Liked Podcasts",
  description: "Your favorite podcasts in one place.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function showTokenFromEpisodes(value: unknown): string | undefined {
  const episodes = Array.isArray(value) ? value : [];
  const first = episodes[0];

  if (!isRecord(first) || !isRecord(first.more_info)) return undefined;

  const showUrl = first.more_info.show_url;
  return typeof showUrl === "string" && showUrl ? getToken(showUrl) : undefined;
}

async function getShowDetails(id: string) {
  const episodes = await api.show.episodes({ id });
  const token = showTokenFromEpisodes(episodes);

  if (!token) return undefined;

  return api.show.details({ token });
}

export default async function LikedPodcastsPage() {
  const favorites = await getUserFavorites();
  const tokens = [...new Set(favorites?.podcasts ?? [])];

  if (tokens.length) {
    const settled = await Promise.allSettled(
      tokens.map((token) => getShowDetails(token)),
    );
    const shows = settled.flatMap((result) =>
      result.status === "fulfilled" && result.value ? [result.value] : [],
    );

    if (shows.length) {
      return (
        <div className="space-y-4">
          <h2 className="font-heading text-xl drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
            Liked Podcasts
          </h2>

          <div className="flex w-full flex-wrap gap-4">
            {shows.map((show) => (
              <SliderCard
                key={show.show_details.id}
                name={decode(show.show_details.title)}
                url={show.show_details.perma_url}
                subtitle={decode(show.show_details.subtitle)}
                type="show"
                image={show.show_details.image}
                explicit={show.show_details.explicit_content}
                hidePlayButton
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
        Nothing here yet. <br /> Like some podcasts to see them here.
      </h3>
    </div>
  );
}
