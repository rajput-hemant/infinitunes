import { api } from "~/lib/trpc/server";
import type {
  Album,
  AllSearch,
  Artist,
  ArtistSongsOrAlbums,
  Category,
  Chart,
  Episode,
  EpisodeDetail,
  FeaturedPlaylists,
  FooterDetails,
  Label,
  Lang,
  Lyrics,
  MegaMenu,
  Mix,
  Modules,
  Playlist,
  Radio,
  SearchReturnType,
  Show,
  Song,
  SongObj,
  Sort,
  TopAlbum,
  TopArtists,
  TopSearch,
  TopShows,
  Trending,
} from "~/types";

/* -----------------------------------------------------------------------------------------------
 * /home route
 * -----------------------------------------------------------------------------------------------*/

export async function getHomeData(lang?: Lang[]) {
  return (await api.home.home({
    lang: lang?.join(","),
  })) as unknown as Modules;
}

/* -----------------------------------------------------------------------------------------------
 * /song route
 * -----------------------------------------------------------------------------------------------*/

export async function getSongDetails(token: string | string[], mini = false) {
  return (await api.song.details({
    id: Array.isArray(token) ? token.join(",") : undefined,
    token: Array.isArray(token) ? undefined : token,
  })) as unknown as SongObj;
}

export async function getSongRecommendations(id: string, lang?: Lang[]) {
  return (await api.song.recommendations({
    id,
    lang: lang?.join(","),
  })) as unknown as Song[];
}

/* -----------------------------------------------------------------------------------------------
 * /album route
 * -----------------------------------------------------------------------------------------------*/

export async function getAlbumDetails(token: string) {
  return (await api.album.details({ token })) as unknown as Album;
}

export async function getAlbumRecommendations(id: string, lang?: Lang[]) {
  return (await api.album.recommendations({
    id,
    lang: lang?.join(","),
  })) as unknown as Album[];
}

export async function getAlbumFromSameYear(year: number, lang?: Lang[]) {
  return (await api.album.sameYear({
    year: `${year}`,
    lang: lang?.join(","),
  })) as unknown as Album[];
}

/* -----------------------------------------------------------------------------------------------
 * /playlist route
 * -----------------------------------------------------------------------------------------------*/

export async function getPlaylistDetails(token: string) {
  return (await api.playlist.details({ token })) as unknown as Playlist;
}

export async function getPlaylistRecommendations(id: string, lang?: Lang[]) {
  return (await api.playlist.recommendations({
    id,
    lang: lang?.join(","),
  })) as unknown as Playlist[];
}

/* -----------------------------------------------------------------------------------------------
 * /artist route
 * -----------------------------------------------------------------------------------------------*/

export async function getArtistDetails(token: string) {
  return (await api.artist.details({
    token,
    n_song: "50",
    n_album: "50",
  })) as unknown as Artist;
}

export async function getArtistsSongs(
  id: string,
  page = 0,
  cat: Category = "popularity",
  sort: Sort = "asc",
) {
  return (await api.artist.songs({
    id,
    page: `${page}`,
    cat,
    sort,
  })) as unknown as Omit<ArtistSongsOrAlbums, "albums">;
}

export async function getArtistsAlbums(
  id: string,
  page = 0,
  cat: Category = "popularity",
  sort: Sort = "asc",
) {
  return (await api.artist.albums({
    id,
    page: `${page}`,
    cat,
    sort,
  })) as unknown as Omit<ArtistSongsOrAlbums, "albums">;
}

export async function getArtistTopSongs(
  artistId: string,
  songId: string,
  lang: Lang,
  page = 1,
  cat: Category = "latest",
  sort: Sort = "asc",
) {
  return (await api.artist.topSongs({
    artist_id: artistId,
    song_id: songId,
    page: `${page}`,
    cat,
    sort,
    lang,
  })) as unknown as Song[];
}

/* -----------------------------------------------------------------------------------------------
 * /show route
 * -----------------------------------------------------------------------------------------------*/

export async function getShowDetails(
  token: string,
  season = 1,
  sort: Sort = "desc",
) {
  return (await api.show.details({
    token,
    season: `${season}`,
    sort,
  })) as unknown as Show;
}

export async function getShowEpisodes(
  id: string,
  season = 1,
  page = 1,
  sort: Sort = "desc",
) {
  return (await api.show.episodes({
    id,
    season: `${season}`,
    page: `${page}`,
    sort,
  })) as unknown as Episode[];
}

export async function getEpisodeDetails(
  token: string,
  season = 1,
  sort: Sort = "desc",
) {
  return (await api.show.episodeDetails({
    token,
    season: `${season}`,
    sort,
  })) as unknown as EpisodeDetail;
}

/* -----------------------------------------------------------------------------------------------
 * /search route
 * -----------------------------------------------------------------------------------------------*/

export async function getTopSearches() {
  return (await api.search.top({})) as unknown as TopSearch[];
}

export async function searchAll(query: string) {
  return (await api.search.all({ q: query })) as unknown as AllSearch;
}

export async function search(
  query: string,
  type: "song" | "album" | "playlist" | "artist" | "show",
  page = 1,
  n = 50,
): Promise<SearchReturnType> {
  const mapped: "songs" | "albums" | "playlists" | "artists" | "podcasts" =
    type === "show" ? "podcasts" : type === "song" ? "songs" : `${type}s`;
  return (await api.search.byType({
    q: query,
    type: mapped,
    page,
    n,
  })) as unknown as SearchReturnType;
}

/* -----------------------------------------------------------------------------------------------
 * /get route
 * -----------------------------------------------------------------------------------------------*/

export async function getTrending(
  type: "song" | "album" | "playlist",
  lang?: Lang[],
) {
  return (await api.get.trending({
    type,
    lang: lang?.join(","),
  })) as unknown as Trending;
}

export async function getTopAlbums(page = 1, n = 50, lang?: Lang) {
  return (await api.get.topAlbums({
    page,
    n,
    lang,
  })) as unknown as TopAlbum;
}

export async function getCharts(page = 1, n = 50, lang?: Lang) {
  return (await api.get.charts({ page, n, lang })) as unknown as Chart[];
}

export async function getFeaturedPlaylists(page = 1, n = 50, lang?: Lang) {
  return (await api.get.featuredPlaylists({
    page,
    n,
    lang,
  })) as unknown as FeaturedPlaylists;
}

export async function getTopArtists(page = 1, n = 50, lang?: Lang) {
  return (await api.get.topArtists({ page, n, lang })) as unknown as TopArtists;
}

export async function getTopShows(page = 1, n = 50, lang?: Lang) {
  return (await api.get.topShows({ page, n, lang })) as unknown as TopShows;
}

export async function getFeaturedRadioStations(page = 1, n = 50, lang?: Lang) {
  return (await api.get.featuredStations({
    page,
    n,
    lang,
  })) as unknown as Radio[];
}

export async function getActorsTopSongs(
  actorID: string,
  songId: string,
  lang: Lang,
) {
  return (await api.get.actorTopSongs({
    actor_id: actorID,
    song_id: songId,
    lang,
  })) as unknown as Song[];
}

export async function getLyrics(id: string) {
  return (await api.get.lyrics({ id })) as unknown as Lyrics;
}

export async function getLabelDetails(
  token: string,
  p = 0,
  n_song = 50,
  n_album = 50,
  cat: Category = "popularity",
  sort: Sort = "asc",
  lang?: Lang,
) {
  return (await api.get.label({
    token,
    page: `${p}`,
    n_song,
    n_album,
    cat,
    sort,
    lang,
  })) as unknown as Label;
}

export async function getMixDetails(
  token: string,
  page = 1,
  n = 20,
  lang: Lang[] = ["hindi", "english"],
) {
  return (await api.get.mix({
    token,
    page,
    n,
    lang: lang.join(","),
  })) as unknown as Mix;
}

export async function getMegaMenu(entity = false, lang?: Lang[]) {
  return (await api.get.megaMenu({
    entity: entity ? "true" : "false",
    lang: lang?.join(","),
  })) as unknown as MegaMenu;
}

export async function getFooterDetails(lang?: Lang[]) {
  return (await api.get.footer({
    lang: lang?.join(",") ?? "hindi",
  })) as unknown as FooterDetails;
}
