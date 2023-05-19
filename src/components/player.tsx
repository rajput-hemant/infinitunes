import { useEffect } from "react";
import { RiVolumeMuteFill, RiVolumeUpFill } from "react-icons/ri";
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

import { cn, decodeHtml, formatTime, getArtists, getImage } from "@/lib/utils";
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
    mute,
    handleMute,
    handleNext,
    handlePrevious,
  } = usePlayer();

  const { song } = useAppSelector((state) => state.player);
  const { imageQuality } = useAppSelector((state) => state.root.preferences);

  useEffect(() => {
    // ...
  }, [imageQuality]);

  return (
    <div
      className={cn(
        "border-border bg-background/90 sticky bottom-16 z-50 border-t backdrop-blur-md lg:bottom-0",
        !isPlaying && "hidden lg:block"
      )}
    >
      <Slider
        max={duration}
        value={[currentTime]}
        onValueChange={(value) => handleTimeChange(value[0])}
        className={cn("invisible z-50", isPlaying && "visible")}
      />

      <div className="flex h-full items-center p-2 pl-4 lg:px-4">
        {/* left container */}
        <div className="flex w-full gap-3 overflow-hidden lg:w-1/3">
          <div className="bg-border aspect-square h-12 rounded md:h-14">
            <img
              src={song ? getImage(song.image, imageQuality) : ""}
              alt={song?.name}
              className="rounded object-cover"
            />
          </div>

          {/* current song info */}
          <div className="flex w-full flex-col justify-center truncate text-center lg:text-start">
            <span className="truncate font-medium">
              {decodeHtml(song?.name ?? "")}
            </span>
            <span className="truncate text-sm">
              {song && decodeHtml(getArtists(song))}
            </span>
          </div>
        </div>

        {/* center container */}
        <div className={cn("flex justify-center lg:w-1/3")}>
          <Button
            variant="ghost"
            onClick={handleLoop}
            className={cn(
              "hover:text-label2 dark:hover:text-label2 hidden border-none lg:flex",
              loop && "text-primary hover:text-secondary"
            )}
          >
            {loop ? <TbRepeatOnce size={30} /> : <TbRepeat size={30} />}
          </Button>

          <Button
            variant="ghost"
            onClick={handlePrevious}
            className="hover:text-label2 dark:hover:text-label2 hidden border-none lg:flex"
          >
            <TbPlayerSkipBackFilled size={30} />
          </Button>

          <Button
            variant="ghost"
            onClick={togglePlayPause}
            className="hover:text-label2 dark:hover:text-label2 border-none"
          >
            {isPlaying ? (
              <TbPlayerPauseFilled size={30} />
            ) : (
              <TbPlayerPlayFilled size={30} />
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleNext}
            className="hover:text-label2 dark:hover:text-label2 hidden border-none lg:flex"
          >
            <TbPlayerSkipForwardFilled size={30} />
          </Button>

          <Button
            variant="ghost"
            onClick={handleShuffle}
            className={cn(
              "hover:text-label2 dark:hover:text-label2 hidden border-none lg:flex",
              shuffle && "text-primary hover:text-secondary"
            )}
          >
            <TbArrowsShuffle size={30} />
          </Button>
        </div>

        {/* right container */}
        <div className="hidden w-1/3 justify-end lg:flex">
          <span className="to-label2 my-auto">
            {formatTime(currentTime)}/{formatTime(duration)}
          </span>

          <div className="flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMute}
              className="border-none"
            >
              {mute ? (
                <RiVolumeMuteFill size={25} />
              ) : (
                <RiVolumeUpFill size={25} />
              )}
            </Button>

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
