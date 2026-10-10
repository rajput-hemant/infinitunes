import { Loader2, Pause, Repeat, Repeat1, Shuffle } from "lucide-react";

import { Icons } from "~/components/icons";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { BarButton } from "./bar-button";
import { ActiveDot } from "./controls";
import type { LoopMode } from "./track-index";

type PlayerTransportProps = {
  isShuffle: boolean;
  loopMode: LoopMode;
  isPlaying: boolean;
  isLoading: boolean;
  onToggleShuffle: () => void;
  onPrevious: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
};

/** The mini player's transport row: shuffle, previous, play/pause, next, repeat. */
export function PlayerTransport({
  isShuffle,
  loopMode,
  isPlaying,
  isLoading,
  onToggleShuffle,
  onPrevious,
  onPlayPause,
  onNext,
  onToggleLoop,
}: PlayerTransportProps) {
  const loopOn = loopMode !== "off";

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2">
      <BarButton
        tooltip={isShuffle ? "Shuffling" : "Shuffle"}
        aria-label={isShuffle ? "Shuffling" : "Shuffle"}
        aria-pressed={isShuffle}
        onClick={onToggleShuffle}
        className={cn(
          controlStyles.transport,
          "hidden md:inline-flex",
          !isShuffle && "text-muted-foreground",
        )}
      >
        <Shuffle aria-hidden strokeWidth={2} className="size-5" />
        <ActiveDot on={isShuffle} />
      </BarButton>

      <BarButton
        tooltip="Previous"
        aria-label="Previous"
        onClick={onPrevious}
        className={cn(controlStyles.transport, "hidden md:inline-flex")}
      >
        <Icons.SkipBack aria-hidden className="size-5" />
      </BarButton>

      <BarButton
        tooltip={isPlaying ? "Pause" : "Play"}
        aria-label={isPlaying ? "Pause" : "Play"}
        onClick={onPlayPause}
        className={cn(
          controlStyles.transportPlayMini,
          "bg-foreground text-background hover:opacity-85",
        )}
      >
        {isLoading ? (
          <Loader2 aria-hidden className="size-5 animate-spin" />
        ) : isPlaying ? (
          <Pause aria-hidden className="size-5" />
        ) : (
          <Icons.Play aria-hidden className="size-5" />
        )}
      </BarButton>

      <BarButton
        tooltip="Next"
        aria-label="Next"
        onClick={onNext}
        className={controlStyles.transport}
      >
        <Icons.SkipForward aria-hidden className="size-5" />
      </BarButton>

      <BarButton
        tooltip={
          loopMode === "track"
            ? "Playing current song on repeat"
            : loopMode === "playlist"
              ? "Looping playlist"
              : "Loop"
        }
        aria-label={loopMode === "track" ? "Looping" : "Loop"}
        aria-pressed={loopOn}
        onClick={onToggleLoop}
        className={cn(
          controlStyles.transport,
          "hidden md:inline-flex",
          !loopOn && "text-muted-foreground",
        )}
      >
        {loopMode === "track" ? (
          <Repeat1 aria-hidden strokeWidth={2} className="size-5" />
        ) : (
          <Repeat aria-hidden strokeWidth={2} className="size-5" />
        )}
        <ActiveDot on={loopOn} />
      </BarButton>
    </div>
  );
}
