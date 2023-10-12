import {
  Album,
  Artist,
  Chart,
  CustomResponse,
  FeaturedPlaylists,
  FooterDetails,
  Lang,
  MegaMenu,
  Modules,
  Playlist,
  Radio,
  Show,
  Song,
  TopAlbum,
  TopArtists,
  TopShows,
  Trending,
} from "@/types";
import { env } from "./env.mjs";

async function jioSaavnGetCall<T>(
  path: string,
  query?: Record<string, string>
): Promise<T> {
  const url = new URL(path, env.NEXT_PUBLIC_JIOSAAVN_API_URL);
  url.search = new URLSearchParams(query).toString();

  const response = await fetch(url);
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
    mini: `${mini}`,
  });
}

export async function getArtistTopSongs(
  artistId: string,
  songId: string,
  page = 1,
  cat: "latest" | "alphabetical" | "popularity" = "latest",
  sort: "asc" | "des" = "asc",
  lang?: Lang,
  mini = true
) {
  return await jioSaavnGetCall<Song[]>("/artist/top-songs", {
    artist_id: artistId,
    song_id: songId,
    page: `${page}`,
    cat,
    sort,
    lang: lang ?? "hindi,english",
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
 * @param sort- Sort order of the episodes. Default is `asc`.
 * @returns Promise resolving to show object.
 */
export async function getShowDetails(
  token: string,
  season = 1,
  sort: "asc" | "des" = "asc"
) {
  return await jioSaavnGetCall<Show>("/show", {
    token,
    season: `${season}`,
    sort,
  });
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
 * @param lang - language(s) to get albums for. Default is `hindi|english`.
 * @param mini - Whether to get mini data. Default is true.
 * @returns Promise resolving to top albums response from JioSaavn API.
 */
export async function getTopAlbums(page?: string, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<TopAlbum>("/get/top-albums", {
    page: page ?? "1",
    n: "42",
    lang: lang ?? "hindi,english",
    mini: `${mini}`,
  });
}

/**
 * Gets the charts from JioSaavn API.
 *
 * @param page - page number to get. Default is `1`.
 * @param lang - language(s) to filter charts by. Default is `hindi|english`.
 * @param mini - Whether to get mini data. Default is true.
 * @returns Promise resolving to array of Chart objects from JioSaavn API.
 */
export async function getCharts(page?: string, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<Chart[]>("/get/charts", {
    page: page ?? "1",
    n: "42",
    lang: lang ?? "hindi,english",
    mini: `${mini}`,
  });
}

/**
 * Gets featured playlists from JioSaavn API.
 *
 * @param page - page number to get. Default is `1`.
 * @param lang - language(s) to get playlists for. Default is `hindi|english`.
 * @param mini - Whether to get mini data. Default is true.
 * @returns Promise resolving to featured playlists response from JioSaavn API.
 */
export async function getFeaturedPlaylists(
  page?: string,
  lang?: Lang,
  mini = true
) {
  return await jioSaavnGetCall<FeaturedPlaylists>("/get/featured-playlists", {
    page: page ?? "1",
    n: "42",
    lang: lang ?? "hindi,english",
    mini: `${mini}`,
  });
}

/**
 * Get the top artists from JioSaavn API.
 *
 * @param page - The page number to fetch. Defaults to `1`.
 * @param lang - The language of the artists to fetch. Defaults to `hindi,english`.
 * @param mini - Whether to fetch minimal artist data. Defaults to `true`.
 * @returns A promise that resolves to an object containing the top artists data.
 */
export async function getTopArtists(page?: string, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<TopArtists>("/get/top-artists", {
    page: page ?? "1",
    n: "42",
    lang: lang ?? "hindi,english",
    mini: `${mini}`,
  });
}

/**
 * Get the top shows from JioSaavn API.
 * @param page - The page number to fetch. Defaults to "1".
 * @param lang - The language of the shows to fetch. Defaults to `hindi|english`.
 * @param mini - Whether to fetch mini version of the shows. Defaults to true.
 * @returns A promise that resolves to an object containing the top shows.
 */
export async function getTopShows(page?: string, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<TopShows>("/get/top-shows", {
    page: page ?? "1",
    n: "42",
    lang: lang ?? "hindi,english",
    mini: `${mini}`,
  });
}

/**
 * Get featured radio stations from JioSaavn API.
 *
 * @param page - The page number of the results to fetch. Defaults to "1".
 * @param lang - The language(s) of the radio stations to fetch. Defaults to `hindi|english`.
 * @param mini - Whether to fetch mini versions of the radio stations. Defaults to true.
 * @returns A promise that resolves to an array of Radio objects.
 */
export async function getFeaturedRadioStations(
  page?: string,
  lang?: Lang,
  mini = true
) {
  return await jioSaavnGetCall<Radio[]>("/get/featured-stations", {
    page: page ?? "1",
    n: "42",
    lang: lang ?? "hindi,english",
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
    lang: lang?.join(",") ?? "hindi",
  });
}
