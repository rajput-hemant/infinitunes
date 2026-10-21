import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/lib/trpc";

const FIRST_ONLY = { page: 1, n: 1 } as const;

/**
 * The first item of each catalog list a Browse tile stands for, fetched one
 * item deep (the web's `n: 1`). Its artwork decorates the tile, and the mix
 * tile links to it. A list that fails or is empty leaves its tile plain, so
 * the tiles never wait on the network.
 */
export function useCategoryCovers() {
  const home = trpc.home.home.queryOptions({});

  return {
    albums: useQuery({
      ...trpc.get.topAlbums.queryOptions(FIRST_ONLY),
      select: (albums) => albums.data[0]?.image,
    }).data,
    charts: useQuery({
      ...trpc.get.charts.queryOptions(FIRST_ONLY),
      select: (charts) => charts[0]?.image,
    }).data,
    playlists: useQuery({
      ...trpc.get.featuredPlaylists.queryOptions(FIRST_ONLY),
      select: (playlists) => playlists.data[0]?.image,
    }).data,
    shows: useQuery({
      ...trpc.get.topShows.queryOptions(FIRST_ONLY),
      select: (shows) => shows.data[0]?.image,
    }).data,
    artists: useQuery({
      ...trpc.get.topArtists.queryOptions(FIRST_ONLY),
      select: (artists) => artists.top_artists[0]?.image,
    }).data,
    stations: useQuery({
      ...trpc.get.featuredStations.queryOptions(FIRST_ONLY),
      select: (stations) => stations[0]?.image,
    }).data,
    newReleases: useQuery({
      ...home,
      select: (modules) => modules.new_albums[0]?.image,
    }).data,
    mix: useQuery({
      ...home,
      select: (modules) => modules.tag_mixes?.[0],
    }).data,
  };
}
