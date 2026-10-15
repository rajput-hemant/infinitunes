import { ArtistLibraryPanel } from "../_components/artist-library";

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
