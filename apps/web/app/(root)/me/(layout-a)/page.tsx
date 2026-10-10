import { Button } from "@infinitunes/ui/components/button";
import { ListMusic, Plus } from "lucide-react";
import React from "react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import {
  LibraryEmpty,
  LibraryHeading,
} from "~/components/library/library-section";
import { NewPlaylistCard } from "~/components/playlist/new-playlist-card";
import { NewPlaylistForm } from "~/components/playlist/new-playlist-form";
import { SliderCardSkeleton } from "~/components/skeletons/slider-card-skeleton";
import { controlStyles } from "~/lib/control-styles";
import { getUserPlaylists } from "~/lib/db/queries";

import { PlaylistItem } from "./_components/playlist-item";

export const metadata = {
  title: "My Playlists",
  description: "Your playlists in one place.",
};

export default async function MyPlaylistsPage() {
  const playlists = await getUserPlaylists();

  return (
    <section className="flex flex-col gap-4">
      <LibraryHeading
        title="My Playlists"
        count={playlists.length}
        noun="playlist"
      />

      {playlists.length ? (
        <CatalogGrid>
          <NewPlaylistCard />

          {playlists.map((playlist) => (
            <React.Suspense
              key={playlist.id}
              fallback={<SliderCardSkeleton hideSubtitle />}
            >
              <PlaylistItem playlist={playlist} />
            </React.Suspense>
          ))}
        </CatalogGrid>
      ) : (
        <LibraryEmpty
          icon={ListMusic}
          title="Create your first playlist"
          description="Collect songs you love into playlists you can play any time."
        >
          <NewPlaylistForm>
            <Button className={controlStyles.textLg}>
              <Plus className="mr-1 size-4" />
              Create Playlist
            </Button>
          </NewPlaylistForm>
        </LibraryEmpty>
      )}
    </section>
  );
}
