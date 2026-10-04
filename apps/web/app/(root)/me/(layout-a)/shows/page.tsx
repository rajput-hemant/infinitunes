import { parseToken } from "@infinitunes/types";
import { Podcast } from "lucide-react";

import { getUserFavorites } from "~/lib/db/queries";
import { api } from "~/lib/trpc/server";

import { LikedCollection } from "../_components/liked-collection";

export const metadata = {
  title: "Liked Podcasts",
  description: "Your favorite podcasts in one place.",
};

async function getShowDetails(id: string) {
  const episodes = await api.show.episodes({ id });
  const showUrl = episodes[0]?.more_info.show_url;

  if (!showUrl) return undefined;

  return api.show.details({ token: parseToken(showUrl) });
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
