import { getToken } from "@infinitunes/types";
import { Podcast } from "lucide-react";

import { getUserFavorites } from "~/lib/db/queries";
import { api } from "~/lib/trpc/server";

import { LikedCollection } from "../_components/liked-collection";

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

  return (
    <LikedCollection
      tokens={favorites?.podcasts ?? []}
      noun="podcast"
      fetchItem={getShowDetails}
      toCard={({ show_details: show }) => ({
        name: show.title,
        url: show.perma_url,
        subtitle: show.subtitle,
        type: "show",
        image: show.image,
        explicit: show.explicit_content,
        hidePlayButton: true,
      })}
      empty={{
        icon: Podcast,
        description: "Tap the heart on a podcast and it will show up here.",
        action: { href: "/show", label: "Browse Podcasts" },
      }}
    />
  );
}
