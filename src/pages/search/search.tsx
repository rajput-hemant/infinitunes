import { useEffect, useState } from "react";
import { api } from "@/api/jiosaavn";
import useSwr from "swr";

import { useAppSelector } from "@/hooks";
import Loading from "@/components/loading";
import Center from "@/components/ui/center";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopographyH3 } from "@/components/ui/topography";
import SearchInput from "./search-input";
import SearchList from "./search-list";

enum TABS {
  // ALL = "ALL",
  SONGS = "SONGS",
  ALBUMS = "ALBUMS",
  PLAYLIST = "PLAYLIST",
}

type ToSearch = keyof typeof TABS;

const getSearchedData = async (query: string, toSearch: ToSearch) => {
  const searchMethods = {
    // ALL: api.searchAll,
    SONGS: api.searchSongs,
    ALBUMS: api.searchAlbums,
    PLAYLIST: api.searchPlaylists,
  };

  if (query.length) return await searchMethods[toSearch](query);
};

const Search = () => {
  const [toSearch, setToSearch] = useState<ToSearch>(TABS.SONGS);

  const { query } = useAppSelector((state) => state.search);
  const { data, isLoading, mutate } = useSwr("/search", () =>
    getSearchedData(query, toSearch)
  );

  useEffect(() => {
    document.title = `Search ${toSearch.toLowerCase()} | Infinitunes`;
  }, [toSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      mutate();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [query, toSearch, mutate]);

  return (
    <div className="space-y-2">
      <SearchInput className="lg:hidden" />

      <TopographyH3 className="w-full truncate text-center">
        {query.length ? (
          <>
            Search results for <span className="text-primary">"{query}"</span>
          </>
        ) : (
          "Start Searching..."
        )}
      </TopographyH3>

      <Tabs
        defaultValue={TABS.SONGS}
        className="flex flex-col items-center gap-2"
      >
        <TabsList className="mx-auto">
          {/* <TabsTrigger
            value={TABS.ALL}
            onClick={() => setToSearch(TABS.ALL)}
            className="md:min-w-[6rem]"
          >
            All
          </TabsTrigger> */}

          <TabsTrigger
            value={TABS.SONGS}
            onClick={() => setToSearch(TABS.SONGS)}
            className="md:min-w-[6rem]"
          >
            Songs
          </TabsTrigger>

          <TabsTrigger
            value={TABS.ALBUMS}
            onClick={() => setToSearch(TABS.ALBUMS)}
            className="md:min-w-[6rem]"
          >
            Albums
          </TabsTrigger>

          <TabsTrigger
            value={TABS.PLAYLIST}
            onClick={() => setToSearch(TABS.PLAYLIST)}
            className="md:min-w-[6rem]"
          >
            Playlists
          </TabsTrigger>
        </TabsList>

        {/* <TabsContent
          value={TABS.ALL}
          className="relative h-full min-h-[20rem] w-full max-w-[80rem] rounded-md md:min-h-[40rem]"
        ></TabsContent> */}

        <TabsContent
          value={TABS.SONGS}
          className="relative h-full min-h-[20rem] w-full max-w-[80rem] rounded-md md:min-h-[40rem]"
        >
          {data && <SearchList item={data} />}

          {isLoading && (
            <Center absolutely>
              <Loading />
            </Center>
          )}
        </TabsContent>

        <TabsContent
          value={TABS.ALBUMS}
          className="relative h-full min-h-[20rem] w-full max-w-[80rem] rounded-md md:min-h-[40rem]"
        >
          {data && <SearchList item={data} />}

          {isLoading && (
            <Center absolutely>
              <Loading />
            </Center>
          )}
        </TabsContent>

        <TabsContent
          value={TABS.PLAYLIST}
          className="relative h-full min-h-[20rem] w-full max-w-[80rem] rounded-md md:min-h-[40rem]"
        >
          {data && <SearchList item={data} />}

          {isLoading && (
            <Center absolutely>
              <Loading />
            </Center>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Search;