import { useEffect } from "react";
import { api } from "@/api/jiosaavn";
import useSwr from "swr";

import { Artist } from "@/types";
import { getImage } from "@/lib/utils";
import Loading from "./loading";
import Center from "./ui/center";
import { Skeleton } from "./ui/skeleton";
import { TopographyH3 } from "./ui/topography";

type ArtistsSidebarProps = {
  artists: string[];
  className?: string;
};

const getArtists = async (ids: string[]) => {
  const artists = await Promise.all(ids.map((id) => api.getArtistDetails(id)));

  // (Artist | null)[] => Artist[]
  return artists.filter((artist) => artist !== null) as Artist[];
};

const ArtistsSidebar = ({ artists }: ArtistsSidebarProps) => {
  const { data, isLoading, mutate } = useSwr("/artists", () =>
    getArtists(artists)
  );

  useEffect(() => {
    mutate();
  }, [artists]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className="relative rounded-md p-4 xl:w-96">
      <TopographyH3 className="pb-4 xl:hidden">Artists</TopographyH3>

      <div className="flex flex-wrap justify-between gap-4 md:justify-normal">
        {isLoading ? (
          <Center absolutely>
            <Loading />
          </Center>
        ) : (
          data?.map((artist) => (
            <div
              key={artist.id}
              className="flex flex-col items-center gap-2 xl:w-full"
            >
              <div
                key={artist.id}
                className="relative aspect-square w-56 overflow-hidden rounded-full"
              >
                <img
                  src={getImage(artist.image)}
                  alt={artist.name}
                  className="object-cover"
                />

                <Skeleton className="absolute" />
              </div>

              <p className="text-label font-bold">{artist.name}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default ArtistsSidebar;
