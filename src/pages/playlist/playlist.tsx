import { useEffect } from "react";
import { api } from "@/api/jiosaavn";
import { useParams } from "react-router-dom";
import useSwr from "swr";

import { MatchParams } from "@/types/params";
import { store } from "@/store";
import { setPlaylists } from "@/store/root-slice";
import { base64ToStr } from "@/lib/utils";
import Loading from "@/components/loading";
import PlaylistHeader from "@/components/playlist-header";
import SongTile from "@/components/song-tile";
import Center from "@/components/ui/center";
import Dialog from "@/components/ui/dialog";

const getPlaylistDetail = async (id?: string) => {
  if (!id) throw new Error("No playlist id provided");

  // check if playlist is already in store
  const playlistStore = store.getState().root.playlists;
  const playlist = playlistStore?.find(
    (playlist) => playlist.id === base64ToStr(id)
  );

  // if playlist is in store, return it else fetch it
  const data = playlist ?? (await api.getPlaylistDetails(base64ToStr(id)));

  // update store
  data && (playlist ?? store.dispatch(setPlaylists([data])));

  return data;
};

const Playlist = () => {
  const { id } = useParams<MatchParams>();

  const { data: playlist, error } = useSwr("/playlist", () =>
    getPlaylistDetail(id)
  );

  useEffect(() => {
    document.title = (playlist?.name || "Playlist") + " | Infinitunes";
  }, [playlist]);

  if (error) {
    return (
      <Dialog heading="Something went wrong!" type="error">
        {error.message}
      </Dialog>
    );
  }

  return playlist ? (
    <>
      <PlaylistHeader item={playlist} />

      {/* songs */}
      <div className="mt-8 flex w-full flex-col gap-2">
        {playlist.songs.map((song, i) => (
          <SongTile key={i} item={song} />
        ))}
      </div>
    </>
  ) : (
    <Center absolutely>
      <Loading iconSize={50} />
    </Center>
  );
};

export default Playlist;
