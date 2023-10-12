import {
  getPlaylistDetails,
  getPlaylistRecommendations,
  getTrending,
} from "@/lib/jiosaavn-api";
import DetailsHeader from "@/components/details-header";
import { ItemCard } from "@/components/item-card";
import SongList from "@/components/song-list";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { H3 } from "@/components/ui/topography";

type Props = { params: { slug: [string, string] } };

const fetcher = async (token: string) => {
  const playlist = await getPlaylistDetails(token);

  const [recommendations, trending] = await Promise.all([
    getPlaylistRecommendations(playlist.id),
    getTrending("playlist"),
  ]);

  return {
    playlist,
    recommendations,
    trending,
  };
};

const PlaylistDetailsPage = async ({ params: { slug } }: Props) => {
  const { playlist, recommendations, trending } = await fetcher(slug[1]);

  return (
    <>
      {/* playlist details header */}
      <DetailsHeader item={playlist} />

      {/* song list */}
      <SongList songs={playlist.songs!} />

      {/* related playlists */}
      {recommendations.length > 0 && (
        <>
          <H3>{playlist.modules?.related_playlist.title}</H3>

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

      {/* trending playlists */}
      <H3>{playlist.modules?.currently_trending_playlists.title}</H3>

      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {trending?.map(({ id, name, url, subtitle, type, image }) => (
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

      {/* playlists artists */}
      <H3>{playlist.modules?.artists.title}</H3>

      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {playlist.artists?.map(({ id, name, url, type, image }) => (
            <ItemCard
              key={id}
              name={name}
              url={url}
              type={type}
              image={image}
            />
          ))}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
};

export default PlaylistDetailsPage;
