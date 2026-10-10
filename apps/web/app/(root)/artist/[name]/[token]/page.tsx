import type { Category } from "@infinitunes/types";
import { decode, getImageSrc, toCardItem } from "@infinitunes/types";
import { Separator } from "@infinitunes/ui/components/separator";
import { Tabs, TabsContent } from "@infinitunes/ui/components/tabs";
import type { Metadata } from "next";
import { cache, Suspense } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { AlbumGridSkeleton } from "~/components/skeletons/album-grid-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";
import { SliderList } from "~/components/slider/slider-list";
import { SongList } from "~/components/song-list/song-list";
import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { orFallback } from "~/lib/degrade";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { sanitizeRichText } from "~/lib/sanitize-rich-text";
import { api } from "~/lib/trpc/server";

import { ArtistsTabList } from "./_components/artists-tab-list";
import { ArtistsTopItems } from "./_components/artists-top-items";
import { CategoryFilter } from "./_components/category-filter";
import { tabForSlug, TABS } from "./_components/tabs";

const getArtist = cache(async (token: string) =>
  orNotFound(
    api.artist.details({
      token,
      n_song: 50,
      n_album: 50,
    }),
  ),
);

const getArtistLibrary = cache(
  async (userPromise: ReturnType<typeof getUser>) => {
    const user = await userPromise;
    const [playlists, favorites] = user
      ? await Promise.all([
          orFallback("user playlists", getUserPlaylists(), undefined),
          orFallback("user favorites", getUserFavorites(), null),
        ])
      : [undefined, undefined];
    return { user, playlists, favorites };
  },
);

type ArtistLibraryTabProps = {
  artist: Awaited<ReturnType<typeof getArtist>>;
  category?: Category;
  userPromise: ReturnType<typeof getUser>;
  type: "songs" | "albums";
};

async function ArtistLibraryTab({
  artist,
  category,
  userPromise,
  type,
}: ArtistLibraryTabProps) {
  const { user, playlists, favorites } = await getArtistLibrary(userPromise);
  const topSongs = artist.topSongs ?? [];

  return (
    <ArtistsTopItems
      key={type === "songs" ? topSongs[0]?.id : artist.topAlbums?.[0]?.id}
      id={artist.artistId}
      type={type}
      category={category}
      user={user}
      userFavorites={favorites}
      userPlaylists={playlists}
      initialSongs={type === "songs" ? topSongs : undefined}
      initialAlbums={type === "albums" ? artist.topAlbums : undefined}
    />
  );
}

type ArtistDetailsPageProps = {
  params: Promise<{ name: string; token: string }>;
  searchParams: Promise<{ cat?: Category }>;
};

export async function generateMetadata({
  params,
}: ArtistDetailsPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const artist = await getArtist(token);

  return pageMetadata({
    title: artist.name,
    description: artist.subtitle,
    url: `/artist/${name}/${token}`,
    image: getImageSrc(artist.image, "high"),
    square: true,
  });
}

export default async function ArtistDetailsPage(props: ArtistDetailsPageProps) {
  const { name, token } = await props.params;
  const { cat } = await props.searchParams;

  // Start the artist fetch before the session lookup resolves so they overlap.
  const artistPromise = getArtist(token);
  artistPromise.catch(() => undefined);

  const userPromise = getUser();
  userPromise.catch(() => undefined);
  const artist = await artistPromise;

  const selectedTab = tabForSlug(name.split("-").pop());

  const topSongs = artist.topSongs ?? [];

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeader item={artist} />

      <Tabs defaultValue={selectedTab}>
        <ArtistsTabList showBio={Boolean(artist.bio)} />

        <Separator className="my-4" />

        <TabsContent
          value={TABS.Overview}
          className="flex flex-col gap-(--page-gap)"
        >
          <h2 className="pl-2 font-heading text-xl text-foreground sm:text-2xl md:text-3xl lg:pl-0">
            {artist.modules?.topSongs?.title}
          </h2>
          <SongList items={topSongs.slice(0, 10)} />
        </TabsContent>

        <TabsContent value={TABS.Songs}>
          <CategoryFilter category={cat ?? "popularity"} />
          <Suspense fallback={<SongListSkeleton length={10} />}>
            <ArtistLibraryTab
              artist={artist}
              category={cat}
              userPromise={userPromise}
              type="songs"
            />
          </Suspense>
        </TabsContent>

        <TabsContent value={TABS.Albums}>
          <CategoryFilter category={cat ?? "popularity"} />
          <Suspense fallback={<AlbumGridSkeleton />}>
            <ArtistLibraryTab
              artist={artist}
              category={cat}
              userPromise={userPromise}
              type="albums"
            />
          </Suspense>
        </TabsContent>

        <TabsContent value={TABS.Biography} className="max-w-3xl">
          {artist.bio && (
            <div
              className="rounded-md bg-card p-6 text-sm leading-6 text-muted-foreground ring-1 ring-inset ring-border"
              dangerouslySetInnerHTML={{
                __html: sanitizeRichText(decode(artist.bio)),
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
