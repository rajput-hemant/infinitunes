import { FaPause, FaPlay } from "react-icons/fa";
import { RxDownload } from "react-icons/rx";

import { Song } from "@/types";
import { setSong } from "@/store/root-slice";
import { decodeHtml, formatTime, getArtists } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { Button } from "@/components/ui/button";

type SongTileProps = {
  index: number;
  item: Song;
};

const SongTile = ({ index, item }: SongTileProps) => {
  const dispatch = useAppDispatch();
  const { isPlaying } = useAppSelector((state) => state.root.player);

  return (
    <div
      onClick={() => dispatch(setSong(item))}
      className="border-border group flex h-16 items-center truncate rounded-md border px-4 shadow-lg hover:bg-white active:scale-[1.005] md:px-6"
    >
      {/* left container */}
      <div className="flex items-center gap-4 overflow-auto md:flex-1">
        {/* song index of play icon */}
        <span className="text-label2 w-4 text-lg font-bold group-hover:hidden">
          {isPlaying ? <FaPause className="text-label" /> : index + 1}
        </span>

        <span className="text-label hidden w-4 text-lg group-hover:flex">
          {isPlaying ? <FaPause /> : <FaPlay />}
        </span>

        {/* name & artists (for small screens) */}
        <div className="flex flex-col truncate">
          <span className="font-medium">{decodeHtml(item.name)}</span>

          <span className="text-sm md:hidden">
            {decodeHtml(getArtists(item))}
          </span>
        </div>
      </div>

      {/* center container */}
      <div className="hidden truncate md:flex md:flex-1">
        {/* artists (for large screens) */}
        <span className="text-sm">{decodeHtml(getArtists(item))}</span>
      </div>

      {/* right container */}
      {/* download and duration */}
      <div className="text-label2 ml-auto flex items-center justify-center gap-4 md:gap-4">
        <Button
          variant="outline"
          size="sm"
          className="hover:border-border rounded-full border-transparent"
        >
          <RxDownload size={18} />
        </Button>

        <span className="text-label2">{formatTime(item.duration)}</span>
      </div>
    </div>
  );
};

export default SongTile;
