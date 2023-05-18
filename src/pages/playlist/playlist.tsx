import { api } from "@/api/jiosaavn";
import { useParams } from "react-router-dom";
import useSwr from "swr";

import { MatchParams } from "@/types/params";
import { base64ToStr } from "@/lib/utils";
import Loading from "@/components/loading";
import PlaylistHeader from "@/components/playlist-header";
import Center from "@/components/ui/center";
import Dialog from "@/components/ui/dialog";
import SongTile from "../../components/song-tile";

const getPlaylistDetail = async (id?: string) => {
  if (!id) throw new Error("No playlist id provided");

  const data = await api.getPlaylistDetails(base64ToStr(id));

  return data;
};

const Playlist = () => {
  const { id } = useParams<MatchParams>();

  const { data: playlist, error } = useSwr("/playlist", () =>
    getPlaylistDetail(id)
  );

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
