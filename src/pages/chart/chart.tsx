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

const getChartDetail = async (id?: string) => {
  if (!id) throw new Error("No chart id provided");

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

const Chart = () => {
  const { id } = useParams<MatchParams>();

  const { data: chart, error } = useSwr("/chart", () => getChartDetail(id));

  useEffect(() => {
    document.title = (chart?.name || "Top Charts") + " | Infinitunes";
  }, [chart]);

  if (error) {
    return (
      <Dialog heading="Something went wrong!" type="error">
        {error.message}
      </Dialog>
    );
  }

  return chart ? (
    <>
      <PlaylistHeader item={chart} />

      {/* songs */}
      <div className="mt-8 flex w-full flex-col gap-2">
        {chart.songs.map((song, i) => (
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

export default Chart;