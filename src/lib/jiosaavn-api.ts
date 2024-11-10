"use server";

import { cookies } from "next/headers";

import type {
  Album,
  AllSearch,
  Artist,
  ArtistSongsOrAlbums,
  Category,
  Chart,
  CustomResponse,
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
} from "@/types";

import { env } from "./env";

async function jioSaavnGetCall<T>(
  path: string,
  query?: Record<string, string>
): Promise<T> {
  const cookiesStore = await cookies(); // this will trigger dynamic rendering
  const languages = cookiesStore.get("language")?.value;

  const queries = {
    ...query,
    lang: query && query["lang"] ? query.lang : (languages ?? "hindi"),
  };

  const url = new URL(path, env.JIOSAAVN_API_URL);
  url.search = new URLSearchParams(queries).toString();

  const response = await fetch(url, { cache: "force-cache" });
  const data = (await response.json()) as CustomResponse<T>;

  if (!response.ok) throw new Error(data.message);

  return data.data!;
}

/* -----------------------------------------------------------------------------------------------
 * /home route
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get home page data from JioSaavn API.
 *
 * @param lang - language(s) to get data for.
 * @param mini - Whether to get mini data. Default `true`.
 * @returns Promise resolving to home page modules data.
 */
export async function getHomeData(lang?: Lang[], mini = true) {
  return await jioSaavnGetCall<Modules>("/modules", {
    lang: lang?.join(",") ?? "",
    mini: `${mini}`,
  });
}

/* -----------------------------------------------------------------------------------------------
 * /song route
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get song details from JioSaavn API.
 * @param token - Song token
 * @param mini - Whether to fetch mini data
 * @returns Promise resolving to song details
 */
export async function getSongDetails(token: string | string[], mini = false) {
  return await jioSaavnGetCall<SongObj>(
    "/song",
    Array.isArray(token) ?
      { id: token.join(","), mini: `${mini}` }
    : { token, mini: `${mini}` }
  );
}

/**
 * Get song recommendations from JioSaavn API.
 * @param id - Song ID to get recommendations for
 * @param lang - language(s) to get data for
 * @param mini - Whether to get mini data. Default `true`.
 * @returns Promise resolving to recommended songs
 */
export async function getSongRecommendations(
  id: string,
  lang?: Lang[],
  mini = true
) {
  return await jioSaavnGetCall<Song[]>("/song/recommend", {
    id,
    lang: lang?.join(",") ?? "",
    mini: `${mini}`,
  });
}

/* -----------------------------------------------------------------------------------------------
 * /album route
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get album details from JioSaavn API.
 *
 * @param token - Album token
 * @param mini - Whether to fetch mini data
 * @returns Promise resolving to album details
 */
export async function getAlbumDetails(token: string, mini = true) {
  return await jioSaavnGetCall<Album>("/album", {
    token,
    mini: `${mini}`,
  });
}

/**
 * Get album recommendations from JioSaavn API.
 *
 * @param id - Album ID to get recommendations for
 * @param lang - language(s) to get data for
 * @param mini - Whether to get mini data. Default `true`.
 * @returns Promise resolving to recommended albums
 */
export async function getAlbumRecommendations(
  id: string,
  lang?: Lang[],
  mini = true
) {
  return await jioSaavnGetCall<Album[]>("/album/recommend", {
    id,
    lang: lang?.join(",") ?? "",
    mini: `${mini}`,
  });
}

/**
 * Get albums released in the same year as the specified year.
 *
 * @param year - The year to search for albums.
 * @param lang - languages(s) to filter the results by.
 * @param mini - Whether to get mini data. Default `true`.
 * @returns A promise that resolves to an array of albums.
 */
export async function getAlbumFromSameYear(
  year: number,
  lang?: Lang[],
  mini = true
) {
  return jioSaavnGetCall<Album[]>("/album/same-year", {
    year: `${year}`,
    lang: lang?.join(",") ?? "",
    mini: `${mini}`,
  });
}

/* -----------------------------------------------------------------------------------------------
 * /playlist route
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get details for a playlist from JioSaavn API.
 *
 * @param token - Playlist token to get details for
 * @param mini - Whether to get mini data. Default `true`.
 * @returns Promise resolving to playlist object
 */
export async function getPlaylistDetails(token: string, mini = true) {
  return await jioSaavnGetCall<Playlist>("/playlist", {
    token,
    mini: `${mini}`,
  });
}

/**
 * Gets playlist recommendations from JioSaavn API.
 *
 * @param id - Playlist ID to get recommendations for
 * @param lang - list of languages to get recommendations in
 * @param mini - Whether to get mini data. Default `true`.
 * @returns Promise resolving to array of recommended playlist objects
 */
export async function getPlaylistRecommendations(
  id: string,
  lang?: Lang[],
  mini = true
) {
  return await jioSaavnGetCall<Playlist[]>("/playlist/recommend", {
    id,
    lang: lang?.join(",") ?? "",
    mini: `${mini}`,
  });
}

/* -----------------------------------------------------------------------------------------------
 * /artist route
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get artist details from JioSaavn API.
 *
 * @param token - Artist token
 * @param mini - Whether to fetch mini data
 * @returns Promise resolving to artist details
 */
export async function getArtistDetails(token: string, mini = true) {
  return await jioSaavnGetCall<Artist>("/artist", {
    token,
    n_song: "50",
    n_album: "50",
    mini: `${mini}`,
  });
}

/**
 * Get artist Top songs from JioSaavn API.
 * @param id - Artist ID
 * @param page - Page number to get
 * @param cat - Category to sort by
 * @param sort - Sort order
 * @param mini - Whether to fetch mini data
 * @returns Promise resolving to artist top songs
 */
export async function getArtistsSongs(
  id: string,
  page = 0,
  cat: Category = "popularity",
  sort: Sort = "asc",
  mini = true
) {
  return await jioSaavnGetCall<Omit<ArtistSongsOrAlbums, "albums">>(
    "/artist/songs",
    {
      id,
      page: `${page}`,
      cat,
      sort,
      mini: `${mini}`,
    }
  );
}

/**
 * Get artist Top albums from JioSaavn API.
 * @param id - Artist ID
 * @param page - Page number to get
 * @param cat - Category to sort by
 * @param sort - Sort order
 * @param mini - Whether to fetch mini data
 * @returns Promise resolving to artist top albums
 */
export async function getArtistsAlbums(
  id: string,
  page = 0,
  cat: Category = "popularity",
  sort: Sort = "asc",
  mini = true
) {
  return await jioSaavnGetCall<Omit<ArtistSongsOrAlbums, "albums">>(
    "/artist/albums",
    {
      id,
      page: `${page}`,
      cat,
      sort,
      mini: `${mini}`,
    }
  );
}

/**
 * Get artist(s) song's recommendations from JioSaavn API.
 * @param artistId - Artist ID(s) to get recommendations for
 * @param songId - Song ID to get recommendations for
 * @param page - Page number to get
 * @param cat - Category to sort by
 * @param sort - Sort order
 * @param lang - Language(s) to filter the results by
 * @param mini - Whether to fetch mini data
 * @returns
 */
export async function getArtistTopSongs(
  artistId: string,
  songId: string,
  lang: Lang,
  page = 1,
  cat: Category = "latest",
  sort: Sort = "asc",
  mini = true
) {
  return await jioSaavnGetCall<Song[]>("/artist/top-songs", {
    artist_id: artistId,
    song_id: songId,
    page: `${page}`,
    cat,
    sort,
    lang,
    mini: `${mini}`,
  });
}

/* -----------------------------------------------------------------------------------------------
 * /show route
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get details for a show from JioSaavn API.
 *
 * @param token - Show token to get details for.
 * @param season - Season number to get details for. Default is `1`.
 * @param sort- Sort order of the episodes. Default is `desc`.
 * @returns Promise resolving to show object.
 */
export async function getShowDetails(
  token: string,
  season = 1,
  sort: Sort = "desc"
) {
  return await jioSaavnGetCall<Show>("/show", {
    token,
    season: `${season}`,
    sort,
  });
}

/**
 * Get episodes for a show from JioSaavn API.
 * @param id - Show ID
 * @param season - Season number to get details for. Default is `1`.
 * @param page - Page number to get
 * @param sort - Sort order of the episodes. Default is `desc`.
 * @returns - Promise resolving to array of episodes
 */
export async function getShowEpisodes(
  id: string,
  season = 1,
  page = 1,
  sort: Sort = "desc"
) {
  return await jioSaavnGetCall<Episode[]>("/show/episodes", {
    id,
    season: `${season}`,
    page: `${page}`,
    sort,
  });
}

/**
 * Get details for an episode from JioSaavn API.
 * @param token - Episode token
 * @param season - Season number to get details for. Default is `1`.
 * @param sort - Sort order of the episodes. Default is `desc`.
 * @returns - Promise resolving to episode details
 */
export async function getEpisodeDetails(
  token: string,
  season = 1,
  sort: Sort = "desc"
) {
  return await jioSaavnGetCall<EpisodeDetail>("/show/episode", {
    token,
    season: `${season}`,
    sort,
  });
}

/* -----------------------------------------------------------------------------------------------
 * /search route
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get search suggestions from JioSaavn API.
 * @returns Promise resolving to search suggestions
 */
export async function getTopSearches() {
  return await jioSaavnGetCall<TopSearch[]>("/search/top");
}

/**
 * Get search results from JioSaavn API.
 * @param query - Search query
 * @returns Promise resolving to search results
 */
export async function searchAll(query: string) {
  return await jioSaavnGetCall<AllSearch>("/search", { q: query });
}

/**
 * Search for songs, albums, playlists, artists or shows from JioSaavn API.
 * @param query - Search query
 * @param type - Type of search results to get
 * @param page - Page number to get
 * @param n - Number of results to get
 * @returns Promise resolving to search results
 */
export async function search(
  query: string,
  type: "song" | "album" | "playlist" | "artist" | "show",
  page = 1,
  n = 50
): Promise<SearchReturnType> {
  return await jioSaavnGetCall(
    `/search/${type === "show" ? "podcast" : type}s`,
    {
      q: query,
      page: `${page}`,
      n: `${n}`,
    }
  );
}

/* -----------------------------------------------------------------------------------------------
 * /get route
 * -----------------------------------------------------------------------------------------------*/

/**
 * Gets trending songs, albums or playlists from JioSaavn API.
 *
 * @param type - The type of trending results to get, either `song | album | playlist`.
 * @param lang - array of language(s) to get trending results for.
 * @param mini - Whether to get mini data. Default is `true`.
 * @returns Promise resolving to trending response.
 */
export async function getTrending(
  type: "song" | "album" | "playlist",
  lang?: Lang[],
  mini = true
) {
  return await jioSaavnGetCall<Trending>("/get/trending", {
    type,
    lang: lang?.join(",") ?? "",
    mini: `${mini}`,
  });
}

/**
 * Gets top albums from JioSaavn API.
 *
 * @param page - page number to get. Default is `1`.
 * @param lang - language(s) to get albums for.
 * @param mini - Whether to get mini data. Default is true.
 * @returns Promise resolving to top albums response from JioSaavn API.
 */
export async function getTopAlbums(page = 1, n = 50, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<TopAlbum>("/get/top-albums", {
    page: `${page}`,
    n: `${n}`,
    lang: lang ?? "",
    mini: `${mini}`,
  });
}

/**
 * Gets the charts from JioSaavn API.
 *
 * @param page - page number to get. Default is `1`.
 * @param lang - language(s) to filter charts by.
 * @param mini - Whether to get mini data. Default is true.
 * @returns Promise resolving to array of Chart objects from JioSaavn API.
 */
export async function getCharts(page = 1, n = 50, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<Chart[]>("/get/charts", {
    page: `${page}`,
    n: `${n}`,
    lang: lang ?? "",
    mini: `${mini}`,
  });
}

/**
 * Gets featured playlists from JioSaavn API.
 *
 * @param page - page number to get. Default is `1`.
 * @param lang - language(s) to get playlists for.
 * @param mini - Whether to get mini data. Default is true.
 * @returns Promise resolving to featured playlists response from JioSaavn API.
 */
export async function getFeaturedPlaylists(
  page = 1,
  n = 50,
  lang?: Lang,
  mini = true
) {
  return await jioSaavnGetCall<FeaturedPlaylists>("/get/featured-playlists", {
    page: `${page}`,
    n: `${n}`,
    lang: lang ?? "",
    mini: `${mini}`,
  });
}

/**
 * Get the top artists from JioSaavn API.
 *
 * @param page - The page number to fetch. Defaults to `1`.
 * @param lang - The language of the artists to fetch.`.
 * @param mini - Whether to fetch minimal artist data. Defaults to `true`.
 * @returns A promise that resolves to an object containing the top artists data.
 */
export async function getTopArtists(
  page = 1,
  n = 50,
  lang?: Lang,
  mini = true
) {
  return await jioSaavnGetCall<TopArtists>("/get/top-artists", {
    page: `${page}`,
    n: `${n}`,
    lang: lang ?? "",
    mini: `${mini}`,
  });
}

/**
 * Get the top shows from JioSaavn API.
 * @param page - The page number to fetch.1".
 * @param lang - The language of the shows to fetch. Defaults to `hindi|english`.
 * @param mini - Whether to fetch mini version of the shows. Defaults to true.
 * @returns A promise that resolves to an object containing the top shows.
 */
export async function getTopShows(page = 1, n = 50, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<TopShows>("/get/top-shows", {
    page: `${page}`,
    n: `${n}`,
    lang: lang ?? "",
    mini: `${mini}`,
  });
}

/**
 * Get featured radio stations from JioSaavn API.
 *
 * @param page - The page number of the results to fetch.1".
 * @param lang - The language(s) of the radio stations to fetch. Defaults to `hindi|english`.
 * @param mini - Whether to fetch mini versions of the radio stations. Defaults to true.
 * @returns A promise that resolves to an array of Radio objects.
 */
export async function getFeaturedRadioStations(
  page = 1,
  n = 50,
  lang?: Lang,
  mini = true
) {
  return await jioSaavnGetCall<Radio[]>("/get/featured-stations", {
    page: `${page}`,
    n: `${n}`,
    lang: lang ?? "",
    mini: `${mini}`,
  });
}

/**
 * Get Actor's Top Songs from JioSaavn API.
 * @param actorID - Actor ID
 * @param songId - Song ID
 * @param lang - Language(s) to filter the results by
 * @param mini -  Whether to fetch mini data
 * @returns
 */
export async function getActorsTopSongs(
  actorID: string,
  songId: string,
  lang: Lang,
  mini = true
) {
  return await jioSaavnGetCall<Song[]>("/get/actor-top-songs", {
    actor_id: actorID,
    song_id: songId,
    lang,
    mini: `${mini}`,
  });
}

/**
 * Get Lyrics for a song from JioSaavn API.
 * @param id - Song ID or Lyrics ID
 * @returns - Promise resolving to Lyrics object
 */
export async function getLyrics(id: string) {
  return await jioSaavnGetCall<Lyrics>("/get/lyrics", { id });
}

/**
 * Get details for a label from JioSaavn API.
 * @param token - Label token
 * @param p - page number to get
 * @param n_song - number of songs to get
 * @param n_album - number of albums to get
 * @param cat - category to sort by
 * @param sort - sort order
 * @param lang - language(s) to filter the results by
 * @param mini - Whether to fetch mini data
 * @returns - Promise resolving to Label object
 */
export async function getLabelDetails(
  token: string,
  p = 0,
  n_song = 50,
  n_album = 50,
  cat: Category = "popularity",
  sort: Sort = "asc",
  lang?: Lang,
  mini = true
) {
  return await jioSaavnGetCall<Label>("/get/label", {
    token,
    p: `${p}`,
    n_song: `${n_song}`,
    n_album: `${n_album}`,
    cat,
    sort,
    lang: lang ?? "",
    mini: `${mini}`,
  });
}

/**
 * Get details for a mix playlist from JioSaavn API.
 * @param token - Mix token
 * @param page - page number to get
 * @param n - number of results to get
 * @param lang - language(s) to filter the results by
 * @param mini - Whether to fetch mini data
 * @returns - Promise resolving to Mix object
 */
export async function getMixDetails(
  token: string,
  page = 1,
  n = 20,
  lang: Lang[] = ["hindi", "english"],
  mini = true
) {
  return await jioSaavnGetCall<Mix>("/get/mix", {
    token,
    page: `${page}`,
    n: `${n}`,
    lang: lang.join(","),
    mini: `${mini}`,
  });
}

/**
 * Fetches the mega menu data from JioSaavn API.
 * @param entity - entity parameter.
 * @param lang - language to filter the results by.
 * @returns A promise that resolves to the MegaMenu object.
 */
export async function getMegaMenu(entity = false, lang?: Lang[]) {
  return await jioSaavnGetCall<MegaMenu>("/get/mega-menu", {
    entity: `${entity}`,
    lang: lang?.join(",") ?? "",
  });
}

/**
 * Fetches footer details from JioSaavn API.
 * @param lang - language(s) to filter the results. Defaults to ["hindi"].
 * @returns A promise that resolves to an object containing footer details.
 */
export async function getFooterDetails(lang?: Lang[]) {
  return await jioSaavnGetCall<FooterDetails>("/get/footer-details", {
    lang: lang?.join(",") ?? "",
  });
}
