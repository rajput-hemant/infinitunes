import type { Category } from "@/types";

import { DetailsHeader } from "@/components/details-header";
import { ItemCard } from "@/components/item-card";
import { SongList } from "@/components/song/song-list";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { H3, Small } from "@/components/ui/topography";
import { getArtistDetails } from "@/lib/jiosaavn-api";
import ArtistsTabList from "./artists-tab-list";
import ArtistsTopItems from "./artists-top-items";
import CategoryFilter from "./category-filter";
import { TABS } from "./tabs";

type Props = {
  params: { slug: [string, string] };
  searchParams: { cat?: Category };
};

const ArtistDetailsPage = async ({
  params: { slug },
  searchParams: { cat },
}: Props) => {
  const artist = await getArtistDetails(slug[1]);
  const path = `/artist/${slug.join("/")}`;
  let selectedTab: TABS;

  switch (slug[0].split("-").pop()) {
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

  /* navigate on click on tab using <Link/> */
  // const hrefConstructor = (tab: string) => {
  //   const suffixMap = {
  //     [TABS.Overview]: "",
  //     [TABS.Songs]: "-songs",
  //     [TABS.Albums]: "-albums",
  //     [TABS.Biography]: "-bio",
  //   };

  //   const segment =
  //     slug[0].replace(/(-songs|-albums|-bio)/, "") +
  //     suffixMap[tab as keyof typeof TABS];

  //   return `/artist/${segment}/${slug[1]}`;
  // };

  return (
    <div className="space-y-4">
      {/* artist details */}
      <DetailsHeader item={artist} />

      <Tabs defaultValue={selectedTab}>
        <ArtistsTabList showBio={artist.bio.length === 0} />
        {/* navigate on click on tab using <Link /> */}
        {/* <TabsList className="mx-auto mb-4 flex w-fit lg:mx-0">
          {Object.keys(TABS).map((tab, i) => {
            if (artist.bio.length === 0 && tab === TABS.Biography) return;

            return (
              <Link key={i} href={hrefConstructor(tab)}>
                <TabsTrigger value={tab}>{tab}</TabsTrigger>
              </Link>
            );
          })}
        </TabsList> */}

        <Separator />

        <TabsContent value={TABS.Overview} className="space-y-4">
          <H3>{artist.modules.top_songs.title}</H3>
          <SongList items={artist.top_songs.slice(0, 10)} />
        </TabsContent>

        <TabsContent value={TABS.Songs}>
          <CategoryFilter path={path} category={cat ?? "popularity"} />

          <ArtistsTopItems
            id={artist.id}
            type="songs"
            category={cat}
            initialSongs={artist.top_songs}
          />
        </TabsContent>

        <TabsContent value={TABS.Albums}>
          <CategoryFilter path={path} category={cat ?? "popularity"} />

          <ArtistsTopItems
            id={artist.id}
            type="albums"
            category={cat}
            initialAlbums={artist.top_albums}
          />
        </TabsContent>

        <TabsContent value={TABS.Biography} className="max-w-3xl">
          {artist.bio.map(({ title, text }) => (
            <>
              <H3 className="my-4">{title}</H3>
              <Small className="leading-3">{text}</Small>
            </>
          ))}
        </TabsContent>
      </Tabs>

      {/* Dedicated Playlists */}
      <H3>{artist.modules.dedicated_artist_playlist.title}</H3>
      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {artist.dedicated_artist_playlist?.map(
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

      {/* Featured Playlists */}
      <H3>{artist.modules.featured_artist_playlist.title}</H3>
      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {artist.featured_artist_playlist?.map(
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

      {/* Artist's Top albums */}
      <H3>{artist.modules.top_albums.title}</H3>
      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {artist.top_albums?.map(
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

      {/* Artist's Singles*/}
      <H3>{artist.modules.singles.title}</H3>
      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {artist.singles?.map(({ id, name, url, subtitle, type, image }) => (
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

      {/* Latest releases */}
      <H3>{artist.modules.latest_release.title}</H3>
      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {artist.latest_release?.map(
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
    </div>
  );
};

export default ArtistDetailsPage;
