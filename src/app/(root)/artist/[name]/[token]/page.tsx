import type { Metadata } from "next";
import type { Category } from "@/types";

import { DetailsHeader } from "@/components/details-header";
import { SliderList } from "@/components/slider";
import { SongList } from "@/components/song-list";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { getUser } from "@/lib/auth";
import { getUserFavorites, getUserPlaylists } from "@/lib/db/queries";
import { getArtistDetails } from "@/lib/jiosaavn-api";
import { ArtistsTabList } from "./_components/artists-tab-list";
import { ArtistsTopItems } from "./_components/artists-top-items";
import { CategoryFilter } from "./_components/category-filter";
import { TABS } from "./_components/tabs";

type Props = {
  params: Promise<{ name: string; token: string }>;
  searchParams: Promise<{ cat?: Category }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name, token } = await params;

  const artist = await getArtistDetails(token);

  return {
    title: artist.name,
    description: artist.subtitle,
    openGraph: {
      title: artist.name,
      description: artist.subtitle,
      url: `/artist/${name}/${token}`,
      images: {
        url: `/api/og?title=${artist.name}&description=${artist.subtitle}&image=${artist.image[2].link}&square=true`,
        alt: artist.name,
      },
    },
  };
}

export default async function ArtistDetailsPage(props: Props) {
  const { name, token } = await props.params;
  const { cat } = await props.searchParams;

  const user = await getUser();

  const [artist, playlists, favorites] = await Promise.all([
    getArtistDetails(token),
    user ? getUserPlaylists(user.id) : undefined,
    user ? getUserFavorites(user.id) : undefined,
  ]);

  let selectedTab: TABS;

  switch (name.split("-").pop()) {
    case "songs":
      selectedTab = TABS.Songs;
      break;
    case "albums":
      selectedTab = TABS.Albums;
      break;
    case "bio":
      selectedTab = TABS.Biography;
      break;
    default:
      selectedTab = TABS.Overview;
      break;
  }

  return (
    <div className="space-y-4">
      <DetailsHeader item={artist} />

      <Tabs defaultValue={selectedTab}>
        <ArtistsTabList showBio={artist.bio.length !== 0} />

        <Separator className="my-4" />

        <TabsContent value={TABS.Overview} className="space-y-4">
          <h2 className="pl-2 font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl lg:pl-0">
            {artist.modules.top_songs.title}
          </h2>
          <SongList items={artist.top_songs.slice(0, 10)} />
        </TabsContent>

        <TabsContent value={TABS.Songs}>
          <CategoryFilter category={cat ?? "popularity"} />

          <ArtistsTopItems
            key={artist.top_songs[0].id}
            id={artist.id}
            type="songs"
            category={cat}
            user={user}
            userFavorites={favorites}
            userPlaylists={playlists}
            initialSongs={artist.top_songs}
          />
        </TabsContent>

        <TabsContent value={TABS.Albums}>
          <CategoryFilter category={cat ?? "popularity"} />

          <ArtistsTopItems
            key={artist.top_albums[0].id}
            id={artist.id}
            type="albums"
            category={cat}
            user={user}
            userFavorites={favorites}
            userPlaylists={playlists}
            initialAlbums={artist.top_albums}
          />
        </TabsContent>

        <TabsContent value={TABS.Biography} className="max-w-3xl">
          {artist.bio.map(({ title, text }) => (
            <div key={title}>
              <h2 className="my-4 pl-2 font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl lg:pl-0">
                {title}
              </h2>
              <small
                className="leading-2"
                dangerouslySetInnerHTML={{
                  __html: text.replace(/\r\n/g, "<br>"),
                }}
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <SliderList
        title={artist.modules.dedicated_artist_playlist.title}
        items={artist.dedicated_artist_playlist}
      />

      <SliderList
        title={artist.modules.featured_artist_playlist.title}
        items={artist.featured_artist_playlist}
      />

      <SliderList
        title={artist.modules.top_albums.title}
        items={artist.top_albums}
      />

      <SliderList
        title={artist.modules.top_songs.title}
        items={artist.top_songs}
      />

      <SliderList title={artist.modules.singles.title} items={artist.singles} />

      <SliderList
        title={artist.modules.latest_release.title}
        items={artist.latest_release}
      />

      <SliderList
        title={artist.modules.similar_artists.title}
        items={artist.similar_artists}
      />
    </div>
  );
}
