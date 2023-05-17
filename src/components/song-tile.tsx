import { RxDownload } from "react-icons/rx";
import { TbPlayerPlayFilled } from "react-icons/tb";
import { useNavigate } from "react-router-dom";

import { Album, Playlist, Song } from "@/types";
import { setSong } from "@/store/root-slice";
import {
  clearUrl,
  decodeHtml,
  formatTime,
  getArtists,
  getImage,
  strToBase64,
} from "@/lib/utils";
import { useAppDispatch } from "@/hooks";
import { Button } from "@/components/ui/button";

const SongTile = ({ item }: { item: Song | Album | Playlist }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { id, type, name, image } = item;

  const onClickHandler = () => {
    const url = clearUrl(name);
    const base64Id = strToBase64(id);

    // @ts-ignore
    if (type === "") {
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
      className="border-border hover:bg-muted group flex h-[4.5rem] items-center gap-2 truncate rounded-md border px-2 shadow-lg active:scale-[1.005] sm:pr-4 md:pr-6"
    >
      <div className="group/image relative aspect-square w-16 overflow-hidden rounded">
        <img
          src={getImage(image)}
          alt={name}
          className="object-cover transition-transform duration-300 group-hover/image:scale-105"
        />

        {/* play button */}
        <TbPlayerPlayFilled className="invisible absolute inset-0 grid h-full w-full p-4 group-hover/image:visible" />
      </div>

      {/* name & artists */}
      <div className="flex w-full flex-col truncate md:flex-row">
        <span className="truncate font-medium md:w-1/2">
          {decodeHtml(name)}
        </span>

        <span className="my-auto truncate text-sm md:w-1/2">
          {type !== "playlist" && decodeHtml(getArtists(item))}

          {type === undefined && (item as Playlist).firstname}
        </span>
      </div>

      {/* download and duration */}
      <div className="text-label2 ml-auto flex items-center justify-center gap-4 md:gap-4">
        <Button
          variant="outline"
          size="sm"
          className="hover:border-border rounded-full border-transparent"
        >
          <RxDownload size={18} />
        </Button>

        {/* @ts-ignore */}
        {type == "" && (
          <span className="text-label2">
            {formatTime((item as Song).duration)}
          </span>
        )}
      </div>
    </div>
  );
};

export default SongTile;
