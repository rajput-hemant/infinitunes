import type { Metadata } from "next";

import { artistTabMetadata, getArtist } from "../_components/artist-data";
import { ArtistLibraryPanel } from "../_components/artist-library";

export async function generateMetadata({
  params,
}: PageProps<"/artist/[name]/[token]/albums">): Promise<Metadata> {
  const { name, token } = await params;

  return artistTabMetadata(await getArtist(token), name, token, "albums");
}

export default function ArtistAlbumsPage({
  params,
  searchParams,
}: PageProps<"/artist/[name]/[token]/albums">) {
  return (
    <ArtistLibraryPanel
      params={params}
      searchParams={searchParams}
      type="albums"
    />
  );
}
