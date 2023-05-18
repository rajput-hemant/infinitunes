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

const getChartDetail = async (id?: string) => {
  if (!id) throw new Error("No chart id provided");

  const data = await api.getPlaylistDetails(base64ToStr(id));

  return data;
};

const Chart = () => {
  const { id } = useParams<MatchParams>();

  const { data: chart, error } = useSwr("/chart", () => getChartDetail(id));

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
