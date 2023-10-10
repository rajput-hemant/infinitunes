import {
  Album,
  Chart,
  CustomResponse,
  FeaturedPlaylists,
  FooterDetails,
  Lang,
  MegaMenu,
  Modules,
  Playlist,
  Radio,
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
 * Get Home Page Data
 * @param lang List of languages to get data for
 * @param mini Whether to get mini data or not
 * @returns Home Page Data
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
 * Get Album Details
 * @param token Album Token
 * @param mini Whether to get mini data or not
 * @returns Album Details
 */
export async function getAlbumDetails(token: string, mini = true) {
  return await jioSaavnGetCall<Album>("/album", {
    token,
    mini: `${mini}`,
  });
}

/**
 * Get Album Recommendations
 * @param id Album ID
 * @param lang List of languages to get data for
 * @param mini Whether to get mini data or not
 * @returns Album Recommendations
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
 * Get Album From Same Year
 * @param year Year
 * @param lang List of languages to get data for
 * @param mini Whether to get mini data or not
 * @returns Album From Same Year
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
 * Get Playlist Details
 * @param token Playlist Token
 * @param mini Whether to get mini data or not
 * @returns Playlist Details
 */
export async function getPlaylistDetails(token: string, mini = true) {
  return await jioSaavnGetCall<Playlist>("/playlist", {
    token,
    mini: `${mini}`,
  });
}

/**
 * Get Playlist Recommendations
 * @param id Playlist ID
 * @param lang List of languages to get data for
 * @param mini Whether to get mini data or not
 * @returns Playlist Recommendations
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
 * /get route
 * -----------------------------------------------------------------------------------------------*/

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

export async function getTopAlbums(page?: string, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<TopAlbum>("/get/top-albums", {
    page: page ?? "1",
    n: "42",
    lang: lang ?? "hindi,english",
    mini: `${mini}`,
  });
}

export async function getCharts(page?: string, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<Chart[]>("/get/charts", {
    page: page ?? "1",
    n: "42",
    lang: lang ?? "hindi,english",
    mini: `${mini}`,
  });
}

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

export async function getTopArtists(page?: string, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<TopArtists>("/get/top-artists", {
    page: page ?? "1",
    n: "42",
    lang: lang ?? "hindi,english",
    mini: `${mini}`,
  });
}

export async function getTopShows(page?: string, lang?: Lang, mini = true) {
  return await jioSaavnGetCall<TopShows>("/get/top-shows", {
    page: page ?? "1",
    n: "42",
    lang: lang ?? "hindi,english",
    mini: `${mini}`,
  });
}

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

export async function getMegaMenu(entity = false, lang?: Lang[]) {
  return await jioSaavnGetCall<MegaMenu>("/get/mega-menu", {
    entity: `${entity}`,
    lang: lang?.join(",") ?? "",
  });
}

export async function getFooterDetails(lang?: Lang[]) {
  return await jioSaavnGetCall<FooterDetails>("/get/footer-details", {
    lang: lang?.join(",") ?? "hindi",
  });
}
