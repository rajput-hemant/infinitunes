import { api } from "@/api/jiosaavn";
import { RxDownload, RxShare2 } from "react-icons/rx";
import { useParams } from "react-router-dom";
import useSwr from "swr";

import { MatchParams } from "@/types/params";
import { base64ToStr } from "@/lib/utils";
import Card from "@/components/card";
import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import Center from "@/components/ui/center";
import Dialog from "@/components/ui/dialog";
import { TopographyH2, TopographySmall } from "@/components/ui/topography";
import SongTile from "../song/song-tile";

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
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 text-center md:flex-row md:justify-start md:text-left">
        {/* image card */}
        <Card item={playlist} className="w-56 md:w-80" />

        {/* playlist info */}
        <div className="flex h-full w-full flex-col gap-2">
          <TopographyH2>{playlist.name}</TopographyH2>

          {/* <TopographyH4 className="font-medium">
          </TopographyH4> */}

          <TopographySmall>
            {(parseInt(playlist.followerCount) / 1000).toFixed(1)}K Followers ·{" "}
            {playlist.songCount} Songs
          </TopographySmall>

          {/* buttons */}
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <Button className="w-fit gap-1 rounded-full px-9 text-lg font-bold">
              Play
            </Button>

            <Button variant="outline" size="sm" className="rounded-full">
              <RxDownload size={18} />
            </Button>

            <Button variant="outline" size="sm" className="rounded-full">
              <RxShare2 size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* songs */}
      <div className="mt-8 flex w-full flex-col gap-2">
        {playlist.songs.map((song, i) => (
          <SongTile key={i} index={i} item={song} />
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
