import { Host, Slider } from "@expo/ui/jetpack-compose";

import type { SeekSliderProps } from "./seek-slider-props";

/** A Material 3 `Slider`: Compose reports only the listener's drags. */
export function SeekSlider({
  value,
  max,
  onScrub,
  onScrubEnd,
  colors,
}: SeekSliderProps) {
  return (
    <Host style={{ height: 32 }}>
      <Slider
        value={value}
        min={0}
        max={max}
        colors={
          colors
            ? {
                thumbColor: colors.active,
                activeTrackColor: colors.active,
                inactiveTrackColor: colors.inactive,
              }
            : undefined
        }
        onValueChange={onScrub}
        onValueChangeFinished={onScrubEnd}
      />
    </Host>
  );
}
