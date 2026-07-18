import type { Metadata } from "next";

import { DetailsHeader } from "@/components/details-header";
import { SliderList } from "@/components/slider";
import { SongList } from "@/components/song-list";
import { Separator } from "@/components/ui/separator";
import {
  getActorsTopSongs,
  getAlbumDetails,
  getArtistTopSongs,
  getLyrics,
  getSongDetails,
  getSongRecommendations,
  getTrending,
} from "@/lib/jiosaavn-api";
import { Lyrics } from "./_components/lyrics";

type SongDetailsPageProps = {
  params: Promise<{
    name: string;
    token: string;
  }>;
};

export async function generateMetadata({
  params,
}: SongDetailsPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const songObj = await getSongDetails(token);
  const song = songObj.songs[0];

  return {
    title: song.name,
    description: song.subtitle,
    openGraph: {
      title: song.name,
      description: song.subtitle,
      url: `/song/${name}/${token}`,
      images: {
        url: `/api/og?title=${song.name}&description=${song.subtitle}&image=${song.image[2].link}&square=true`,
        alt: song.name,
      },
    },
  };
}
async function fetcher(token: string) {
  const data = await getSongDetails(token);
  const song = data.songs[0];
  const modules = data.modules!;
  const artistsTopSongsParams = modules.songs_by_same_artists.params;
  const actorsTopSongsParams = modules.songs_by_same_actors.params;
  const isActorPresent = song.artist_map.artists.some(
    (artist) => artist.role === "starring"
  );

  const [
    lyrics,
    album,
    recommendations,
    trending,
    songsFromSameArtists,
    songsFromSameActors,
  ] = await Promise.all([
    song.has_lyrics ? getLyrics(song.id ?? "") : undefined,
    getAlbumDetails(song.album_url.split("/").pop()!),
    getSongRecommendations(song.id),
    getTrending("song"),
    getArtistTopSongs(
      artistsTopSongsParams.artist_id,
      artistsTopSongsParams.song_id,
      artistsTopSongsParams.lang
    ),
    isActorPresent ?
      getActorsTopSongs(
        actorsTopSongsParams.actor_id,
        actorsTopSongsParams.song_id,
        actorsTopSongsParams.lang
      )
    : undefined,
  ]);

  return {
    song,
    lyrics,
    albumSongs: album.songs.filter((s) => s.id !== song.id),
    recommendations,
    trending,
    songsFromSameArtists,
    songsFromSameActors,
    modules,
  };
}

export default async function SongDetailsPage(props: SongDetailsPageProps) {
  const { token } = await props.params;

  const {
    song,
    lyrics,
    albumSongs,
    modules,
    recommendations,
    songsFromSameArtists,
    songsFromSameActors,
    trending,
  } = await fetcher(token);

  return (
    <div className="space-y-4">
      <DetailsHeader item={song} />

      {lyrics && <Lyrics lyrics={lyrics} />}

      {albumSongs.length > 0 && (
        <>
          <h2 className="pl-2 font-heading text-2xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl lg:pl-0">
            More from {song.album}
          </h2>
          <Separator />
          <SongList items={albumSongs} />
        </>
      )}

      {recommendations.length > 0 && (
        <SliderList title={modules.recommend.title} items={recommendations} />
      )}

      {trending.length > 0 && (
        <SliderList title={modules.currently_trending.title} items={trending} />
      )}

      {trending.length > 0 && (
        <SliderList
          title={modules.songs_by_same_artists.title}
          items={songsFromSameArtists}
        />
      )}

      {songsFromSameActors && songsFromSameActors.length > 0 && (
        <SliderList
          title={modules.songs_by_same_actors.title}
          items={songsFromSameActors}
        />
      )}

      <SliderList
        title={modules.artists.title}
        items={song.artist_map.artists}
      />
    </div>
  );
}
