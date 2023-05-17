import { RiVolumeUpFill } from "react-icons/ri";
import {
  TbArrowsShuffle,
  TbPlayerPauseFilled,
  TbPlayerPlayFilled,
  TbPlayerSkipBackFilled,
  TbPlayerSkipForwardFilled,
  TbRepeat,
  TbRepeatOnce,
  // TbRepeatOnce,
} from "react-icons/tb";

import { cn, formatTime, getArtists, getImage } from "@/lib/utils";
import { useAppSelector } from "@/hooks";
import usePlayer from "@/hooks/usePlayer";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";

const Player = () => {
  const {
    isPlaying,
    togglePlayPause,
    currentTime,
    duration,
    handleTimeChange,
    handleVolume,
    loop,
    handleLoop,
    shuffle,
    handleShuffle,
  } = usePlayer();

  const { song } = useAppSelector((state) => state.root.player);

  return (
    <div className="border-border bg-background/90 sticky bottom-0 z-50 h-20 border-t backdrop-blur-md">
      <Slider
        max={duration}
        value={[currentTime]}
        onValueChange={(value) => handleTimeChange(value[0])}
        className={cn("invisible", isPlaying && "visible")}
      />

      <div className="flex h-full items-center px-4">
        {/* left container */}
        <div className="flex w-full gap-3 lg:w-1/3">
          <div className="bg-border aspect-square h-14 overflow-hidden rounded">
            <img
              src={song ? getImage(song.image) : ""}
              alt={song?.name}
              className="object-cover"
            />
          </div>

          {/* current song info */}
          <div className="flex w-full flex-col justify-center text-center lg:text-start">
            <span className="truncate font-medium">{song?.name}</span>
            <span className="truncate text-sm">{song && getArtists(song)}</span>
          </div>
        </div>

        {/* center container */}
        <div className="flex justify-center lg:w-1/3">
          <Button
            variant="ghost"
            onClick={handleLoop}
            className={cn(
              "hover:text-label2 hidden border-none lg:flex",
              loop && "text-primary hover:text-secondary"
            )}
          >
            {loop ? <TbRepeatOnce size={30} /> : <TbRepeat size={30} />}
          </Button>

          <Button
            variant="ghost"
            className="hover:text-label2 hidden border-none lg:flex"
          >
            <TbPlayerSkipBackFilled size={30} />
          </Button>

          <Button
            variant="ghost"
            onClick={togglePlayPause}
            className="hover:text-label2 border-none"
          >
            {isPlaying ? (
              <TbPlayerPauseFilled size={30} />
            ) : (
              <TbPlayerPlayFilled size={30} />
            )}
          </Button>

          <Button
            variant="ghost"
            className="hover:text-label2 hidden border-none lg:flex"
          >
            <TbPlayerSkipForwardFilled size={30} />
          </Button>

          <Button
            variant="ghost"
            onClick={handleShuffle}
            className={cn(
              "hover:text-label2 hidden border-none lg:flex",
              shuffle && "text-primary hover:text-secondary"
            )}
          >
            <TbArrowsShuffle size={30} />
          </Button>
        </div>

        {/* right container */}
        <div className="hidden w-1/3 justify-end gap-4 lg:flex">
          <span className="to-label2 my-auto">
            {formatTime(currentTime)}/{formatTime(duration)}
          </span>

          <div className="flex gap-2">
            <RiVolumeUpFill size={25} />
            <Slider
              defaultValue={[75]}
              onValueChange={(volume) => handleVolume(volume[0] / 100)}
              className="w-44"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
