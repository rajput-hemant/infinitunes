import { SheetHeader } from "~/components/sheet-header";
import { NewPlaylistScreen } from "~/features/library/new-playlist-screen";

/** "New Playlist" from a song or collection menu: a sheet over any tab. */
export default function CreatePlaylistRoute() {
  return (
    <>
      <SheetHeader title="New Playlist" />
      <NewPlaylistScreen />
    </>
  );
}
