import type {
  Album,
  Lyrics as LyricsType,
  Song,
  SongObj,
  Trending,
} from "@infinitunes/types";
import { Separator } from "@infinitunes/ui/components/separator";
import type { Metadata } from "next";

import { DetailsHeader } from "~/components/details-header";
import { SliderList } from "~/components/slider";
import { SongList } from "~/components/song-list";
import { api } from "~/lib/trpc/server";
import { getImageSrc, ogImageUrl, toCardItem } from "~/lib/utils";

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

  const songObj = (await api.song.details({ token })) as unknown as SongObj;
  const song = songObj.songs[0];

  return {
    title: song.title,
    description: song.subtitle,
    openGraph: {
      title: song.title,
      description: song.subtitle,
      url: `/song/${name}/${token}`,
      images: {
        url: ogImageUrl({
          title: song.title,
          description: song.subtitle,
          image: getImageSrc(song.image, "high"),
          square: true,
        }),
        alt: song.title,
      },
    },
  };
}
async function fetcher(token: string) {
  const data = (await api.song.details({ token })) as unknown as SongObj;
  const song = data.songs[0];
  const modules = data.modules!;
  const artistsTopSongsParams = modules.songsBysameArtists.source_params;
  const actorsTopSongsParams = modules.songsBysameActors.source_params;
  const isActorPresent = song.more_info.artistMap?.artists?.some(
    (artist) => artist.role === "starring",
  );

  const [
    lyrics,
    album,
    recommendations,
    trending,
    songsFromSameArtists,
    songsFromSameActors,
  ] = await Promise.all([
    song.more_info.has_lyrics === "true"
      ? (api.get.lyrics({
          id: song.id ?? "",
        }) as unknown as Promise<LyricsType>)
      : undefined,
    api.album.details({
      token: song.more_info.album_url.split("/").pop()!,
    }) as unknown as Promise<Album>,
    api.song.recommendations({ id: song.id }) as unknown as Promise<Song[]>,
    api.get.trending({ type: "song" }) as unknown as Promise<Trending>,
    api.artist.topSongs({
      artist_id: artistsTopSongsParams.artist_ids,
      song_id: artistsTopSongsParams.song_id,
      lang: artistsTopSongsParams.language,
    }) as unknown as Promise<Song[]>,
    isActorPresent
      ? (api.get.actorTopSongs({
          actor_id: actorsTopSongsParams.actor_ids,
          song_id: actorsTopSongsParams.song_id,
          lang: actorsTopSongsParams.language,
        }) as unknown as Promise<Song[]>)
      : undefined,
  ]);

  return {
    song,
    lyrics,
    albumSongs: Array.isArray(album.list)
      ? album.list.filter((s) => s.id !== song.id)
      : [],
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
          <h2 className="pl-2 font-heading text-2xl drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl lg:pl-0">
            More from {song.more_info.album}
          </h2>
          <Separator />
          <SongList items={albumSongs} />
        </>
      )}

      {recommendations.length > 0 && (
        <SliderList
          title={modules.reco.title}
          items={recommendations.map(toCardItem)}
        />
      )}

      {trending.length > 0 && (
        <SliderList
          title={modules.currentlyTrending.title}
          items={trending.map(toCardItem)}
        />
      )}

      {trending.length > 0 && (
        <SliderList
          title={modules.songsBysameArtists.title}
          items={songsFromSameArtists.map(toCardItem)}
        />
      )}

      {songsFromSameActors && songsFromSameActors.length > 0 && (
        <SliderList
          title={modules.songsBysameActors.title}
          items={songsFromSameActors.map(toCardItem)}
        />
      )}

      <SliderList
        title={modules.artists.title}
        items={(song.more_info.artistMap?.artists ?? []).map((artist) => ({
          id: artist.id,
          name: artist.name,
          url: artist.perma_url,
          type: artist.type,
          image: artist.image,
        }))}
      />
    </div>
  );
}
