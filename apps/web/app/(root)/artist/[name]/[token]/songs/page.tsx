import type { Metadata } from "next";

import { artistTabMetadata, getArtist } from "../_components/artist-data";
import { ArtistLibraryPanel } from "../_components/artist-library";

export async function generateMetadata({
  params,
}: PageProps<"/artist/[name]/[token]/songs">): Promise<Metadata> {
  const { name, token } = await params;

  return artistTabMetadata(await getArtist(token), name, token, "songs");
}

export default function ArtistSongsPage({
  params,
  searchParams,
}: PageProps<"/artist/[name]/[token]/songs">) {
  return (
    <ArtistLibraryPanel
      params={params}
      searchParams={searchParams}
      type="songs"
    />
  );
}
