import { decode, getImageSrc, toCardItem } from "@infinitunes/types";
import type { Metadata } from "next";
import { Suspense } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { DetailsHeaderSkeleton } from "~/components/details-header/details-header-skeleton";
import { SliderListSkeleton } from "~/components/slider/shelf-skeleton";
import { SliderList } from "~/components/slider/slider-list";
import { splitArtistSlug } from "~/lib/artist-route";
import { pageMetadata } from "~/lib/metadata";

import { artistBio, getArtist } from "./_components/artist-data";
import { ArtistTabsSkeleton } from "./_components/artist-skeleton";
import { ArtistTabNav } from "./_components/artist-tab-nav";

type ArtistLayoutProps = LayoutProps<"/artist/[name]/[token]">;
type ArtistParams = ArtistLayoutProps["params"];

export async function generateMetadata({
  params,
}: ArtistLayoutProps): Promise<Metadata> {
  const { name, token } = await params;

  const artist = await getArtist(token);

  return pageMetadata({
    title: artist.name,
    description: artist.subtitle,
    // Every tab shares the artist's canonical URL: the Overview route.
    url: `/artist/${splitArtistSlug(name).name}/${token}`,
    image: getImageSrc(artist.image, "high"),
    square: true,
  });
}

async function ArtistHeader({ params }: { params: ArtistParams }) {
  const { token } = await params;

  return <DetailsHeader item={await getArtist(token)} />;
}

async function ArtistTabs({ params }: { params: ArtistParams }) {
  const { name, token } = await params;
  const artist = await getArtist(token);

  return (
    <ArtistTabNav
      name={splitArtistSlug(name).name}
      token={token}
      showBio={artistBio(artist).length > 0}
    />
  );
}

async function ArtistShelves({ params }: { params: ArtistParams }) {
  const { token } = await params;
  const artist = await getArtist(token);
  const topSongs = artist.topSongs ?? [];

  return (
    <>
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
    </>
  );
}

/**
 * The artist frame. The tabs are child routes (`/songs`, `/albums`, `/bio`), so
 * this layout (header, tab row, shelves) stays mounted across tab switches and
 * only the panel in `children` suspends. Each part reads the artist behind its
 * own boundary; the catalog call underneath is cached.
 */
export default function ArtistLayout({ children, params }: ArtistLayoutProps) {
  return (
    <div className="flex flex-col gap-(--page-gap)">
      <Suspense fallback={<DetailsHeaderSkeleton type="artist" />}>
        <ArtistHeader params={params} />
      </Suspense>

      <div className="flex flex-col gap-2">
        <Suspense fallback={<ArtistTabsSkeleton />}>
          <ArtistTabs params={params} />
        </Suspense>

        {children}
      </div>

      <Suspense fallback={<SliderListSkeleton sections={3} />}>
        <ArtistShelves params={params} />
      </Suspense>
    </div>
  );
}
