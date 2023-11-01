import {
  getAlbumDetails,
  getAlbumFromSameYear,
  getAlbumRecommendations,
  getTrending,
} from "@/lib/jiosaavn-api";
import { DetailsHeader } from "@/components/details-header";
import { ItemCard } from "@/components/item-card";
import { SongList } from "@/components/song/song-list";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { H3 } from "@/components/ui/topography";

type Props = { params: { slug: [string, string] } };

const fetcher = async (token: string) => {
  const album = await getAlbumDetails(token);

  const [recommendations, trending, sameYear] = await Promise.all([
    getAlbumRecommendations(album.id),
    getTrending("album"),
    getAlbumFromSameYear(album.year),
  ]);

  return {
    album,
    recommendations,
    trending,
    sameYear,
  };
};

const AlbumDetailsPage = async ({ params: { slug } }: Props) => {
  const { album, recommendations, trending, sameYear } = await fetcher(slug[1]);

  return (
    <div className="space-y-4">
      {/* album details */}
      <DetailsHeader item={album} />

      {/* song list */}
      <SongList items={album.songs} showAlbum={false} />

      {/* album recommendations */}
      {recommendations.length > 0 && (
        <>
          <H3>{album.modules.recommend.title}</H3>

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

      {/* trending albums */}
      <H3>{album.modules.currently_trending.title}</H3>

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

      {/* albums from same year */}
      <H3>{album.modules.top_albums_from_same_year.title}</H3>

      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {sameYear?.map(({ id, name, url, subtitle, type, image }) => (
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

      {/* album artist */}
      <H3>{album.modules.artists.title}</H3>

      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {album.artist_map.artists.map(
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

export default AlbumDetailsPage;
