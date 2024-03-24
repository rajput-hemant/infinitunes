import type { Category } from "@/types";

import { DetailsHeader } from "@/components/details-header";
import { SliderList } from "@/components/slider";
import { SongList } from "@/components/song-list";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { getArtistDetails } from "@/lib/jiosaavn-api";
import { ArtistsTabList } from "./_components/artists-tab-list";
import { ArtistsTopItems } from "./_components/artists-top-items";
import { CategoryFilter } from "./_components/category-filter";
import { TABS } from "./_components/tabs";

type ArtistDetailsPageProps = {
  params: { name: string; token: string };
  searchParams: { cat?: Category };
};

export default async function ArtistDetailsPage(props: ArtistDetailsPageProps) {
  const {
    params: { name, token },
    searchParams: { cat },
  } = props;

  // 5 seconds delay
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const artist = await getArtistDetails(token);

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
            id={artist.id}
            type="songs"
            category={cat}
            initialSongs={artist.top_songs}
          />
        </TabsContent>

        <TabsContent value={TABS.Albums}>
          <CategoryFilter category={cat ?? "popularity"} />

          <ArtistsTopItems
            id={artist.id}
            type="albums"
            category={cat}
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
