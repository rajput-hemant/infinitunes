import React from "react";
import { Plus } from "lucide-react";

import { NewPlaylistForm } from "@/components/playlist/new-playlist-form";
import { SliderCardSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { getUserPlaylists } from "@/lib/db/queries";
import { PlaylistItem } from "./_components/playlist-item";

export const metadata = {
  title: "My Playlists",
  description: "Your playlists in one place.",
};

export default async function MyPlaylistsPage() {
  const user = await getUser();
  const playlists = await getUserPlaylists(user!.id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          My Playlists
        </h2>

        {playlists.length > 0 && (
          <NewPlaylistForm>
            <Button size="sm">
              <Plus className="mr-1 size-4" />
              Create Playlist
            </Button>
          </NewPlaylistForm>
        )}
      </div>

      {playlists.length ?
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
      : <div className="flex h-44 flex-col items-center justify-center space-y-4 rounded-md border border-dashed lg:h-[25rem]">
          <h3 className="py-6 text-center font-heading text-xl drop-shadow-md sm:text-2xl md:text-3xl">
            You don&apos;t have any playlist yet 😢.
          </h3>

          <NewPlaylistForm>
            <Button>
              <Plus className="mr-1 size-4" />
              Create Playlist
            </Button>
          </NewPlaylistForm>
        </div>
      }
    </div>
  );
}
