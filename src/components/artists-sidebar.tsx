import { useEffect } from "react";
import { api } from "@/api/jiosaavn";
import useSwr from "swr";

import { Artist } from "@/types";
import { store } from "@/store";
import { setArtists } from "@/store/root-slice";
import { getImage } from "@/lib/utils";
import { useAppSelector } from "@/hooks";
import Loading from "./loading";
import Center from "./ui/center";
import { Skeleton } from "./ui/skeleton";
import { TopographyH3 } from "./ui/topography";

type ArtistsSidebarProps = {
  artists: string[];
  className?: string;
};

const getArtists = async (ids: string[]) => {
  const artists = await Promise.all(
    ids.map((id) => {
      const artistStore = store.getState().root.artists;

      const artist = artistStore?.find((artist) => artist.id === id);

      return artist ?? api.getArtistDetails(id);
    })
  );

  // (Artist | null)[] => Artist[]
  const data = artists.filter((artist) => artist !== null) as Artist[];

  store.dispatch(setArtists(data));

  return data;
};

const ArtistsSidebar = ({ artists }: ArtistsSidebarProps) => {
  const { imageQuality } = useAppSelector((state) => state.root.preferences);

  const { data, isLoading, mutate } = useSwr("/artists", () =>
    getArtists(artists)
  );

  useEffect(() => {
    mutate();
  }, [artists]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className="relative rounded-md p-4 xl:w-96">
      <TopographyH3 className="pb-4 xl:hidden">Artists</TopographyH3>

      {/* artists container */}
      <div className="flex flex-wrap justify-between gap-4 md:justify-normal">
        {isLoading ? (
          <Center absolutely>
            <Loading />
          </Center>
        ) : (
          data?.map((artist) => (
            // artist card
            <div
              key={artist.id}
              className="flex flex-col items-center gap-2 xl:w-full"
            >
              <div
                key={artist.id}
                className="relative aspect-square w-36 overflow-hidden rounded-full sm:w-44 md:w-48 lg:w-56"
              >
                <img
                  src={getImage(artist.image, imageQuality)}
                  alt={artist.name}
                  className="object-cover"
                />

                <Skeleton className="absolute" />
              </div>

              <p className="text-label line-clamp-2 text-center font-bold">
                {artist.name}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default ArtistsSidebar;
