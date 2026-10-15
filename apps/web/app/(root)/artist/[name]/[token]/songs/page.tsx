import { ArtistLibraryPanel } from "../_components/artist-library";

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
