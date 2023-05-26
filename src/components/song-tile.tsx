import { RxDownload } from "react-icons/rx";
import { TbPlayerPlayFilled } from "react-icons/tb";
import { useNavigate } from "react-router-dom";

import { Album, Playlist, Song } from "@/types";
import { setSong } from "@/store/player-slice";
import {
  clearUrl,
  decodeHtml,
  downloadSong,
  formatTime,
  getArtists,
  getImage,
  strToBase64,
} from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "./ui/skeleton";

const SongTile = ({ item }: { item: Song | Album | Playlist }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { downloadQuality } = useAppSelector((state) => state.root.preferences);

  const { id, type, name, image } = item;

  const onClickHandler = () => {
    const url = clearUrl(name);
    const base64Id = strToBase64(id);

    if ("label" in item) {
      dispatch(setSong(item));
    } else if (type === "album") {
      navigate(`/album/${url}/${base64Id}`);
    } else {
      navigate(`/playlist/${url}/${base64Id}`);
    }
  };

  return (
    <div
      onClick={onClickHandler}
      className="border-border hover:bg-muted group flex h-[4.5rem] items-center gap-2 truncate rounded-md border px-2 shadow-md active:scale-[1.005] sm:pr-4 md:pr-6"
    >
      <div className="hover:shadow-primary group relative aspect-square w-16 overflow-hidden rounded">
        {/* image */}
        <img
          src={getImage(image, "small")}
          alt={id}
          className="w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* skeleton */}
        <Skeleton className="absolute inset-0 -z-10 h-full w-full" />

        {/* play button */}
        <div className="invisible absolute inset-0 z-20 grid place-items-center group-hover:visible">
          <div className="grid aspect-square w-6 place-items-center rounded-full bg-black/50 transition-all duration-200 hover:w-8 hover:bg-black/75">
            <TbPlayerPlayFilled className="text-white" />
          </div>
        </div>

        {/* overlay */}
        <div className="invisible absolute inset-0 z-10 rounded bg-black/50 group-hover:visible" />
      </div>

      {/* name & artists */}
      <div className="flex w-full flex-col truncate md:flex-row">
        <span className="truncate font-medium md:w-1/2">
          {decodeHtml(name)}
        </span>

        <span className="my-auto truncate text-sm md:w-1/2">
          {type !== "playlist" && decodeHtml(getArtists(item))}

          {"userId" in item && decodeHtml(item.firstname)}
        </span>
      </div>

      {/* download and duration */}
      {"label" in item && (
        <div className="text-label2 ml-auto flex items-center justify-center gap-4 md:gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadSong(item, downloadQuality)}
            className="hover:border-border rounded-full border-transparent"
          >
            <RxDownload size={18} />
          </Button>

          <span className="text-label2">{formatTime(item.duration)}</span>
        </div>
      )}
    </div>
  );
};

export default SongTile;
