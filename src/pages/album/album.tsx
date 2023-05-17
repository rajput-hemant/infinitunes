import { api } from "@/api/jiosaavn";
import { RxDownload, RxShare2 } from "react-icons/rx";
import { useParams } from "react-router-dom";
import useSwr from "swr";

import { MatchParams } from "@/types/params";
import { setPlaylist } from "@/store/root-slice";
import { base64ToStr, getArtistIds, getArtists } from "@/lib/utils";
import { useAppDispatch } from "@/hooks";
import ArtistsSidebar from "@/components/artists-sidebar";
import Card from "@/components/card";
import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import Center from "@/components/ui/center";
import Dialog from "@/components/ui/dialog";
import {
  TopographyH2,
  TopographyH4,
  TopographySmall,
} from "@/components/ui/topography";
import SongTile from "../../components/song-tile";

const getAlbumDetail = async (id?: string) => {
  if (!id) throw new Error("No album id provided");

  const data = await api.getAlbumDetails(base64ToStr(id));

  return data;
};

const Album = () => {
  const { id } = useParams<MatchParams>();
  const dispatch = useAppDispatch();

  const { data: album, error } = useSwr("/album", () => getAlbumDetail(id));

  if (error) {
    return (
      <Dialog heading="Something went wrong!" type="error">
        {error.message}
      </Dialog>
    );
  }

  return album ? (
    <>
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 text-center md:flex-row md:justify-start md:text-left">
        {/* image card */}
        <Card item={album} className="w-56 md:w-80" />

        {/* album info */}
        <div className="flex h-full w-full flex-col gap-2">
          <TopographyH2>{album.name}</TopographyH2>

          <TopographyH4 className="font-medium">
            by {getArtists(album)}
          </TopographyH4>

          <TopographySmall>
            {album.songCount} Songs · {album.year}
          </TopographySmall>

          {/* buttons */}
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <Button
              onClick={() => dispatch(setPlaylist(album.songs))}
              className="w-fit gap-1 rounded-full px-9 text-lg font-bold"
            >
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

      <div className="flex flex-col-reverse gap-2 py-6 xl:flex-row">
        {/* artists */}
        <ArtistsSidebar artists={getArtistIds(album)} />

        {/* songs */}
        <div className="flex w-full flex-col gap-2">
          {album.songs.map((song, i) => (
            <SongTile key={i} index={i} item={song} />
          ))}
        </div>
      </div>
    </>
  ) : (
    <Center absolutely>
      <Loading iconSize={50} />
    </Center>
  );
};

export default Album;
