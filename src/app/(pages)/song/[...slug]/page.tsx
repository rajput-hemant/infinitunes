import type { Lang } from "@/types";

import { DetailsHeader } from "@/components/details-header";
import { ItemCard } from "@/components/item-card";
import { SongList } from "@/components/song/song-list";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { H3 } from "@/components/ui/topography";
import {
  getActorsTopSongs,
  getAlbumDetails,
  getArtistTopSongs,
  getLyrics,
  getSongDetails,
  getSongRecommendations,
  getTrending,
} from "@/lib/jiosaavn-api";
import Lyrics from "./lyrics";

type Props = { params: { slug: [string, string] } };

const fetcher = async (token: string) => {
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
      artistsTopSongsParams.lang as Lang
    ),
    isActorPresent ?
      getActorsTopSongs(
        actorsTopSongsParams.actor_id,
        actorsTopSongsParams.song_id,
        actorsTopSongsParams.lang as Lang
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
};

const Page = async ({ params: { slug } }: Props) => {
  const {
    song,
    lyrics,
    albumSongs,
    modules,
    recommendations,
    songsFromSameArtists,
    songsFromSameActors,
    trending,
  } = await fetcher(slug[1]);

  return (
    <div className="space-y-4">
      <DetailsHeader item={song} />

      {lyrics && <Lyrics lyrics={lyrics} />}

      {/* more songs from same album */}
      {albumSongs.length > 0 && (
        <>
          <H3>More from {song.album}</H3>
          <Separator />
          <SongList items={albumSongs} />
        </>
      )}

      {/* song recommendations */}
      {recommendations.length > 0 && (
        <>
          <H3>{modules.recommend.title}</H3>

          <ScrollArea>
            <div className="flex space-x-4 pb-4">
              {recommendations.map(
                ({ id, name, url, subtitle, type, image }) => (
                  <ItemCard
                    key={id}
                    name={name}
                    url={url}
                    subtitle={subtitle}
                    type={type}
                    image={image}
                  />
                )
              )}
            </div>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      )}

      {/* trending songs */}
      {trending.length > 0 && (
        <>
          <H3>{modules.currently_trending.title}</H3>

          <ScrollArea>
            <div className="flex space-x-4 pb-4">
              {trending.map(({ id, name, url, subtitle, type, image }) => (
                <ItemCard
                  key={id}
                  name={name}
                  url={url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                />
              ))}
            </div>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      )}

      {/* songs from same artists */}
      {trending.length > 0 && (
        <>
          <H3>{modules.songs_by_same_artists.title}</H3>

          <ScrollArea>
            <div className="flex space-x-4 pb-4">
              {songsFromSameArtists.map(
                ({ id, name, url, subtitle, type, image }) => (
                  <ItemCard
                    key={id}
                    name={name}
                    url={url}
                    subtitle={subtitle}
                    type={type}
                    image={image}
                  />
                )
              )}
            </div>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      )}

      {/* songs from same actors */}
      {songsFromSameActors && songsFromSameActors.length > 0 && (
        <>
          <H3>{modules.songs_by_same_actors.title}</H3>

          <ScrollArea>
            <div className="flex space-x-4 pb-4">
              {songsFromSameActors.map(
                ({ id, name, url, subtitle, type, image }) => (
                  <ItemCard
                    key={id}
                    name={name}
                    url={url}
                    subtitle={subtitle}
                    type={type}
                    image={image}
                  />
                )
              )}
            </div>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      )}

      {/* artists */}
      <H3>{modules.artists.title}</H3>

      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {song.artist_map.artists.map(
            ({ id, name, url, type, image, role }) => (
              <ItemCard
                key={id}
                name={name}
                url={url}
                type={type}
                image={image}
                subtitle={role || "Artist"}
              />
            )
          )}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default Page;
