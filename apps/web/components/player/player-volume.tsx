import { Slider } from "@infinitunes/ui/components/slider";
import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";
import * as React from "react";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { BarButton } from "./bar-button";
import { scrubClass, sliderValueOf, useSliderValueText } from "./controls";

type PlayerVolumeProps = {
  isMuted: boolean;
  isReady: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (percent: number) => void;
};

/** Mute button and volume slider, shown from the bar's second breakpoint up. */
export function PlayerVolume({
  isMuted,
  isReady,
  volume,
  onToggleMute,
  onVolumeChange,
}: PlayerVolumeProps) {
  const volumeLabelId = React.useId();
  const volumeRef = useSliderValueText(
    `${isMuted ? 0 : Math.round(volume * 100)} percent`,
  );

  return (
    <div className="hidden items-center gap-1 @min-[860px]:flex">
      <BarButton
        tooltip={isMuted ? "Unmute" : "Mute"}
        aria-label={isMuted ? "Unmute" : "Mute"}
        aria-pressed={isMuted}
        onClick={onToggleMute}
        className={cn(
          controlStyles.transport,
          (!isReady || isMuted) && "text-muted-foreground",
        )}
      >
        {isMuted || volume === 0 ? (
          <VolumeX aria-hidden className="size-5" />
        ) : volume < 0.33 ? (
          <Volume aria-hidden className="size-5" />
        ) : volume < 0.66 ? (
          <Volume1 aria-hidden className="size-5" />
        ) : (
          <Volume2 aria-hidden className="size-5" />
        )}
      </BarButton>

      <span id={volumeLabelId} className="sr-only">
        Volume
      </span>
      <Slider
        ref={volumeRef}
        aria-labelledby={volumeLabelId}
        value={[isMuted ? 0 : volume * 100]}
        defaultValue={[75]}
        min={0}
        max={100}
        step={1}
        onValueChange={(value: number | readonly number[]) =>
          onVolumeChange(sliderValueOf(value))
        }
        className={cn(scrubClass, "w-24 min-w-16", !isReady && "opacity-50")}
      />
    </div>
  );
}
