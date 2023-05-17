import {
  Album,
  AlbumSearch,
  AllSearch,
  Artist,
  ArtistAlbum,
  ArtistSong,
  CResponse,
  Langs,
  Modules,
  Playlist,
  PlaylistSearch,
  Song,
  SongSearch,
} from "@/types";
import { clearUrl, isJioSaavnLink } from "@/lib/utils";

type ArtistParams<T> = (
  id: string,
  page?: number,
  cat?: "alphabetical" | "latest",
  sort?: "asc" | "desc"
) => Promise<T | null>;

const JIOSAAVN_ENDPOINT = import.meta.env.VITE_JIOSAAVN_ENDPOINT;

/**
 * Makes a `GET` request to the `JioSaavn API`
 * @param path The path to make the request to
 * @returns The response data or null
 */
const jioSaavnGetCall = async <T>(path: string): Promise<T | null> => {
  const url = `${JIOSAAVN_ENDPOINT}${path.startsWith("/") ? path : `/${path}`}`;

  const response = (await (await fetch(url)).json()) as CResponse<T>;

  return response.data;
};

/**
 * Gets the home data
 * @param langs Languages for regional data, default is `['hindi','english']`
 * @returns The home data i.e. `trending, songs, albums, charts, playlist` or null
 */
const getHomeData = async (langs?: Langs[]) => {
  return await jioSaavnGetCall<Modules>(`/modules?langs=${langs?.join(",")}`);
};

/**
 * Gets the song details
 * @param query The song `id` or `JioSaavn link`
 * @returns The song details or null
 */
const getSongDetails = async (query: string) => {
  return isJioSaavnLink(query)
    ? await jioSaavnGetCall<Song>(`/songs/link=${query}`)
    : await jioSaavnGetCall<Song>(`/songs?id=${query}`);
};

/**
 * Gets the album details
 * @param query The album `id` or `JioSaavn link`
 * @returns The album details or null
 */
const getAlbumDetails = async (query: string) => {
  return isJioSaavnLink(query)
    ? await jioSaavnGetCall<Album>(`/albums/link=${query}`)
    : await jioSaavnGetCall<Album>(`/albums?id=${query}`);
};

/**
 * Gets the playlist details
 * @param id The playlist `id`
 * @returns The playlist details or null
 */
const getPlaylistDetails = async (id: string) => {
  return await jioSaavnGetCall<Playlist>(`/playlists?id=${id}`);
};

/**
 * Gets the artist details
 * @param query The artist `id` or `JioSaavn link`
 * @returns The artist details or null
 */
const getArtistDetails = async (query: string) => {
  return isJioSaavnLink(query)
    ? await jioSaavnGetCall<Artist>(`/artists/link=${query}`)
    : await jioSaavnGetCall<Artist>(`/artists?id=${query}`);
};

/**
 * Gets the songs of an Artist
 * @param id Artist id
 * @param page page number
 * @param cat category
 * @param sort sort order
 * @returns The songs of the artist or null
 */
const getArtistSongs: ArtistParams<ArtistSong[]> = async (
  id,
  page = 1,
  cat,
  sort
) => {
  return await jioSaavnGetCall(
    `/artists/${id}/songs?page=${page}&cat=${cat}&sort=${sort}`
  );
};

/**
 * Gets the albums of an Artist
 * @param id Artist id
 * @param page page number
 * @param cat category
 * @param sort sort order
 * @returns The albumns of the artist or null
 */
const getArtistAlbums: ArtistParams<ArtistAlbum[]> = async (
  id,
  page = 1,
  cat,
  sort
) => {
  return await jioSaavnGetCall(
    `/artists/${id}/albums?page=${page}&cat=${cat}&sort=${sort}`
  );
};

/**
 * Gets the recommended songs of an Artist. `NOTE:` Id of both the artist and song is required
 * @param artistId Artist `id`
 * @param songId Song `id`
 * @returns The recommended songs of the artist or null
 */
const getArtistRecommendedSongs = async (
  artistId: string,
  songId: string,
  langs?: Langs[]
) => {
  return await jioSaavnGetCall<Song[]>(
    `/artists/${artistId}/recommendations/${songId}?langs=${langs?.join(",")}`
  );
};

/**
 * Search for songs, albums, playlists, artists, etc.
 * @param query The search query
 * @returns The search results or null
 */
const searchAll = async (query: string) => {
  return await jioSaavnGetCall<AllSearch>(
    `/search/all?query=${clearUrl(query)}`
  );
};

/**
 * Search for songs
 * @param query The search query
 * @param page Page number
 * @param limit Limit of songs to return
 * @returns The search results or null
 */
const searchSongs = async (query: string, page = 1, limit = 10) => {
  return await jioSaavnGetCall<SongSearch>(
    `/search/songs?query=${clearUrl(query)}&page=${page}&limit=${limit}`
  );
};
/**
 * Search for albums
 * @param query The search query
 * @param page Page number
 * @param limit Limit of albums to return
 * @returns The search results or null
 */
const searchAlbums = async (query: string, page = 1, limit = 10) => {
  return await jioSaavnGetCall<AlbumSearch>(
    `/search/albums?query=${clearUrl(query)}&page=${page}&limit=${limit}`
  );
};

/**
 * Search for playlists
 * @param query The search query
 * @param page Page number
 * @param limit Limit of playlist to return
 * @returns The search results or null
 */
const searchPlaylists = async (query: string, page = 1, limit = 10) => {
  return await jioSaavnGetCall<PlaylistSearch>(
    `/search/playlists?query=${clearUrl(query)}&page=${page}&limit=${limit}`
  );
};

/**
 * Search for artists
 * @param query The search query
 * @param page Page number
 * @param limit Limit of artist to return
 * @returns The search results or null
 */
const searchArtists = async (query: string, page = 1, limit = 10) => {
  return await jioSaavnGetCall<AllSearch>(
    `/search/artists?query=${clearUrl(query)}&page=${page}&limit=${limit}`
  );
};

export const api = {
  getHomeData,
  getSongDetails,
  getAlbumDetails,
  getPlaylistDetails,
  getArtistDetails,
  getArtistSongs,
  getArtistAlbums,
  getArtistRecommendedSongs,
  searchAll,
  searchSongs,
  searchAlbums,
  searchPlaylists,
  searchArtists,
};
