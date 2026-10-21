import type { ArtistCredit } from "./artist";
import {
  decode,
  getImageSrc,
  isExplicit,
  maxQualityOf,
  newQueueItemId,
  uniqueArtists,
} from "./media";
import type { Queue } from "./misc";
import type { Episode } from "./show";
import type { Song } from "./song";

/** Everything a queue entry holds except the per-entry id it gets when queued. */
export type QueueSource = Omit<Queue, "queueItemId">;

/** Row-only fields, optional so a plain queue entry (the player's menu) fits `QueueSource & RowExtras`. */
export type RowExtras = {
  /** Credits shown in the row; the queue entry's `artists` lists every credit. */
  primaryArtists?: ArtistCredit[];
  album?: string;
  albumUrl?: string;
  releaseDate?: string;
  language?: string;
  /** Set only when upstream flags the track explicit (rows show the "E" mark). */
  explicit?: true;
};

/**
 * What a song or episode row (and its menu) renders from. Built on the server
 * from the raw upstream object (about 3.5 KB of JSON each) so only these
 * fields cross into client components. Texts are already decoded.
 * `maxQuality` carries the `more_info["320kbps"]` cap and `download_url` the
 * decrypted links, so playback and download keep their quality fallback.
 */
export type SongRowItem = QueueSource &
  RowExtras & { primaryArtists: ArtistCredit[] };

function credit(artist: ArtistCredit): ArtistCredit {
  return { id: artist.id, name: artist.name, perma_url: artist.perma_url };
}

const rows = new WeakMap<Song | Episode, SongRowItem>();

/**
 * Maps a raw upstream song or episode to its slim row model. One raw object
 * always yields the same row object, so a page that hands the same songs to
 * its header and to its rows serializes each of them once (React Flight
 * dedupes by reference), and primary artists share the credit objects of
 * `artists` for the same reason.
 */
export function toSongRow(item: Song | Episode): SongRowItem {
  const cached = rows.get(item);
  if (cached) return cached;
  const row = buildSongRow(item);
  rows.set(item, row);
  return row;
}

function buildSongRow(item: Song | Episode): SongRowItem {
  const { more_info: info } = item;
  const album =
    "album" in info && typeof info.album === "string" ? info.album : undefined;
  const albumUrl =
    "album_url" in info && typeof info.album_url === "string"
      ? info.album_url
      : undefined;

  const artists = uniqueArtists(info.artistMap?.artists ?? []).map(credit);
  const known = new Map(artists.map((a) => [a.id, a]));

  return {
    id: item.id,
    type: item.type,
    name: decode(item.title),
    subtitle: decode(item.subtitle),
    url: item.perma_url,
    image: getImageSrc(item.image),
    artists,
    primaryArtists: (info.artistMap?.primary_artists ?? []).map(
      (a) => known.get(a.id) ?? credit(a),
    ),
    download_url: item.download_url ?? info.download_url ?? "",
    duration: Number(info.duration) || 0,
    maxQuality: maxQualityOf(info),
    album: album ? decode(album) : undefined,
    albumUrl,
    releaseDate: info.release_date ?? undefined,
    language: item.language,
    ...(isExplicit(item.explicit_content) ? { explicit: true } : {}),
  };
}

/** A fresh queue entry (own `queueItemId`) from a row or an existing queue entry. */
export function toQueueEntry(source: QueueSource): Queue {
  return {
    queueItemId: newQueueItemId(),
    id: source.id,
    name: source.name,
    subtitle: source.subtitle,
    url: source.url,
    type: source.type,
    image: source.image,
    artists: source.artists,
    download_url: source.download_url,
    duration: source.duration,
    maxQuality: source.maxQuality,
  };
}
