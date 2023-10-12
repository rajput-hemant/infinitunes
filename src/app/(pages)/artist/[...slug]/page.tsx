import {
  getAlbumDetails,
  getAlbumFromSameYear,
  getAlbumRecommendations,
  getArtistDetails,
  getTrending,
} from "@/lib/jiosaavn-api";
import DetailsHeader from "@/components/details-header";
import { ItemCard } from "@/components/item-card";
import SongList from "@/components/song-list";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H3 } from "@/components/ui/topography";

type Props = { params: { slug: [string, string] } };

const fetcher = async (token: string) => {
  const artist = await getArtistDetails(token);

  // const [recommendations, trending, sameYear] = await Promise.all([
  //   getAlbumRecommendations(artist.id),
  //   getTrending("artist"),
  //   getAlbumFromSameYear(artist.year),
  // ]);

  return {
    artist,
    // recommendations,
    // trending,
    // sameYear,
  };
};

enum TABS { // eslint-disable-line no-unused-vars
  Overview = "Overview", // eslint-disable-line no-unused-vars
  Songs = "Songs", // eslint-disable-line no-unused-vars
  Albums = "Albums", // eslint-disable-line no-unused-vars
  Biography = "Biography", // eslint-disable-line no-unused-vars
}

const ArtistDetailsPage = async ({ params: { slug } }: Props) => {
  const { artist } = await fetcher(slug[1]);

  return (
    <>
      {/* artist details */}
      <DetailsHeader item={artist} />

      <Tabs defaultValue={TABS.Overview}>
        <TabsList className="mb-4">
          {Object.keys(TABS).map((tab, i) => (
            <TabsTrigger key={i} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <Separator />

        <TabsContent value={TABS.Overview} className="space-y-4">
          <H3>{artist.modules.top_songs.title}</H3>

          <SongList songs={artist.top_songs} />
        </TabsContent>

        <TabsContent value={TABS.Songs}></TabsContent>

        <TabsContent value={TABS.Albums}></TabsContent>

        <TabsContent value={TABS.Biography}></TabsContent>
      </Tabs>

      {/* song list */}
      {/* <SongList songs={artist.songs} /> */}

      {/* artist recommendations */}
      {/* {recommendations.length > 0 && (
        <>
          <H3>{artist.modules.recommend.title}</H3>

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
      )} */}

      {/* trending albums */}
      {/* <H3>{artist.modules.currently_trending.title}</H3>

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
      </ScrollArea> */}

      {/* albums from same year */}
      {/* <H3>{artist.modules.top_albums_from_same_year.title}</H3>

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
      </ScrollArea> */}

      {/* artist artist */}
      {/* <H3>{artist.modules.artists.title}</H3>

      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {artist.artist_map.artists?.map(({ id, name, url, type, image }) => (
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
      </ScrollArea> */}
    </>
  );
};

export default ArtistDetailsPage;
