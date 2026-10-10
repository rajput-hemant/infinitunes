import { Button } from "@infinitunes/ui/components/button";
import { ListMusic, Plus } from "lucide-react";
import React from "react";

import {
  LibraryEmpty,
  LibraryHeading,
} from "~/components/library/library-section";
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
    <section className="space-y-4">
      <LibraryHeading
        title="My Playlists"
        count={playlists.length}
        noun="playlist"
      >
        {playlists.length > 0 && (
          <NewPlaylistForm>
            <Button className={controlStyles.text}>
              <Plus className="mr-1 size-4" />
              Create Playlist
            </Button>
          </NewPlaylistForm>
        )}
      </LibraryHeading>

      {playlists.length ? (
        <div className="flex w-full flex-wrap gap-4">
          {playlists.map((playlist) => (
            <React.Suspense
              key={playlist.id}
              fallback={<SliderCardSkeleton hideSubtitle />}
            >
              <PlaylistItem playlist={playlist} />
            </React.Suspense>
          ))}
        </div>
      ) : (
        <LibraryEmpty
          icon={ListMusic}
          title="Create your first playlist"
          description="Collect songs you love into playlists you can play any time."
        >
          <NewPlaylistForm>
            <Button className={controlStyles.text}>
              <Plus className="mr-1 size-4" />
              Create Playlist
            </Button>
          </NewPlaylistForm>
        </LibraryEmpty>
      )}
    </section>
  );
}
