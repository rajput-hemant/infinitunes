import type { Category } from "@infinitunes/types";
import { Separator } from "@infinitunes/ui/components/separator";
import { Tabs, TabsContent } from "@infinitunes/ui/components/tabs";
import type { Metadata } from "next";

import { DetailsHeader } from "~/components/details-header";
import { SliderList } from "~/components/slider";
import { SongList } from "~/components/song-list";
import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { getArtistDetails } from "~/lib/jiosaavn-api";
import { decode, getImageSrc, ogImageUrl, toCardItem } from "~/lib/utils";

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
        url: ogImageUrl({
          title: artist.name,
          description: artist.subtitle,
          image: getImageSrc(artist.image, "high"),
          square: true,
        }),
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

  const topSongs = artist.topSongs ?? [];

  return (
    <div className="space-y-4">
      <DetailsHeader item={artist} />

      <Tabs defaultValue={selectedTab}>
        <ArtistsTabList showBio={Boolean(artist.bio)} />

        <Separator className="my-4" />

        <TabsContent value={TABS.Overview} className="space-y-4">
          <h2 className="pl-2 font-heading text-xl drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl lg:pl-0">
            {artist.modules?.topSongs?.title}
          </h2>
          <SongList items={topSongs.slice(0, 10)} />
        </TabsContent>

        <TabsContent value={TABS.Songs}>
          <CategoryFilter category={cat ?? "popularity"} />

          <ArtistsTopItems
            key={topSongs[0]?.id}
            id={artist.artistId}
            type="songs"
            category={cat}
            user={user}
            userFavorites={favorites}
            userPlaylists={playlists}
            initialSongs={topSongs}
          />
        </TabsContent>

        <TabsContent value={TABS.Albums}>
          <CategoryFilter category={cat ?? "popularity"} />

          <ArtistsTopItems
            key={artist.topAlbums?.[0]?.id}
            id={artist.artistId}
            type="albums"
            category={cat}
            user={user}
            userFavorites={favorites}
            userPlaylists={playlists}
            initialAlbums={artist.topAlbums}
          />
        </TabsContent>

        <TabsContent value={TABS.Biography} className="max-w-3xl">
          {artist.bio && (
            <small
              className="leading-2"
              dangerouslySetInnerHTML={{
                __html: decode(artist.bio ?? ""),
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      <SliderList
        title={artist.modules?.dedicated_artist_playlist?.title ?? "Playlists"}
        items={(artist.dedicated_artist_playlist ?? []).map(toCardItem)}
      />

      <SliderList
        title={artist.modules?.featured_artist_playlist?.title ?? "Playlists"}
        items={(artist.featured_artist_playlist ?? []).map(toCardItem)}
      />

      <SliderList
        title={artist.modules?.topAlbums?.title ?? "Albums"}
        items={(artist.topAlbums ?? []).map(toCardItem)}
      />

      <SliderList
        title={artist.modules?.topSongs?.title ?? "Songs"}
        items={topSongs.map(toCardItem)}
      />

      <SliderList
        title={artist.modules?.singles?.title ?? "Singles"}
        items={(artist.singles ?? []).map(toCardItem)}
      />

      <SliderList
        title={artist.modules?.latest_release?.title ?? "Latest Release"}
        items={(artist.latest_release ?? []).map(toCardItem)}
      />

      <SliderList
        title={artist.modules?.similarArtists?.title ?? "Similar Artists"}
        items={
          artist.similarArtists?.map((s) => ({
            id: s.id,
            name: decode(s.name),
            url: s.perma_url,
            type: s.type,
            image: s.image_url,
          })) ?? []
        }
      />
    </div>
  );
}
