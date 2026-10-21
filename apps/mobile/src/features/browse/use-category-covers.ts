import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { trpc } from "~/lib/trpc";

const FIRST_ONLY = { page: 1, n: 1 } as const;

/**
 * The first item of each catalog list a Browse tile stands for, fetched one
 * item deep (the web's `n: 1`). Its artwork decorates the tile, and the mix
 * tile links to it. A list that fails or is empty leaves its tile plain, so
 * the tiles never wait on the network. `refresh` refetches them all (pull to
 * refresh); `refreshing` stays on until every one has settled.
 */
export function useCategoryCovers() {
  const home = trpc.home.home.queryOptions({});
  const queries = {
    albums: useQuery({
      ...trpc.get.topAlbums.queryOptions(FIRST_ONLY),
      select: (albums) => albums.data[0]?.image,
    }),
    charts: useQuery({
      ...trpc.get.charts.queryOptions(FIRST_ONLY),
      select: (charts) => charts[0]?.image,
    }),
    playlists: useQuery({
      ...trpc.get.featuredPlaylists.queryOptions(FIRST_ONLY),
      select: (playlists) => playlists.data[0]?.image,
    }),
    shows: useQuery({
      ...trpc.get.topShows.queryOptions(FIRST_ONLY),
      select: (shows) => shows.data[0]?.image,
    }),
    artists: useQuery({
      ...trpc.get.topArtists.queryOptions(FIRST_ONLY),
      select: (artists) => artists.top_artists[0]?.image,
    }),
    stations: useQuery({
      ...trpc.get.featuredStations.queryOptions(FIRST_ONLY),
      select: (stations) => stations[0]?.image,
    }),
    newReleases: useQuery({
      ...home,
      select: (modules) => modules.new_albums[0]?.image,
    }),
    mix: useQuery({
      ...home,
      select: (modules) => modules.tag_mixes?.[0],
    }),
  };
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all(Object.values(queries).map((query) => query.refetch()));
    } finally {
      setRefreshing(false);
    }
  }

  return {
    covers: {
      albums: queries.albums.data,
      charts: queries.charts.data,
      playlists: queries.playlists.data,
      shows: queries.shows.data,
      artists: queries.artists.data,
      stations: queries.stations.data,
      newReleases: queries.newReleases.data,
      mix: queries.mix.data,
    },
    refreshing,
    refresh,
  };
}
