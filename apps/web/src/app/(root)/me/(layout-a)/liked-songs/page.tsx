import { Ghost } from "lucide-react";

import { SongList } from "@/components/song-list";
import { getUser } from "@/lib/auth";
import { getUserFavorites } from "@/lib/db/queries";
import { getSongDetails } from "@/lib/jiosaavn-api";

export const metadata = {
  title: "Liked Songs",
  description: "Your favorite songs in one place.",
};

export default async function LikedSongsPage() {
  const user = await getUser();

  const favoriteSongs = await getUserFavorites(user!.id);

  if (favoriteSongs && favoriteSongs.songs.length) {
    const songsDetails = await getSongDetails(favoriteSongs.songs);

    return (
      <div className="space-y-4">
        <h2 className="font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          Liked Songs
        </h2>

        <SongList items={songsDetails.songs} />
      </div>
    );
  }

  return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-md border border-dashed lg:h-[25rem]">
      <Ghost size={64} />

      <h3 className="py-6 text-center font-heading text-xl drop-shadow-md sm:text-2xl md:text-3xl">
        Nothing here yet. <br /> Like some songs to see them here.
      </h3>
    </div>
  );
}
