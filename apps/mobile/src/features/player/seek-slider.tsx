import { Host, Slider } from "@expo/ui/jetpack-compose";

import { SLIDER_HOST } from "./seek-slider-props";
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
    <Host style={SLIDER_HOST}>
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
