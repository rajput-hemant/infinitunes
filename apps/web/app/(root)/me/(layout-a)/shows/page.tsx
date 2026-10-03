import { parseToken } from "@infinitunes/types";
import { Podcast } from "lucide-react";

import {
  LibraryEmpty,
  LibraryHeading,
  LibraryUnavailable,
} from "~/components/library/library-section";
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
  return typeof showUrl === "string" && showUrl
    ? parseToken(showUrl)
    : undefined;
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
          <LibraryHeading
            title="Liked Podcasts"
            count={shows.length}
            noun="podcast"
            missing={tokens.length - shows.length}
          />

          <div className="flex w-full flex-wrap gap-4">
            {shows.map((show) => (
              <SliderCard
                key={show.show_details.id}
                name={show.show_details.title}
                url={show.show_details.perma_url}
                subtitle={show.show_details.subtitle}
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

  if (tokens.length) return <LibraryUnavailable what="liked podcasts" />;

  return (
    <LibraryEmpty
      icon={Podcast}
      title="No liked podcasts yet"
      description="Tap the heart on a podcast and it will show up here."
      action={{ href: "/show", label: "Browse Podcasts" }}
    />
  );
}
