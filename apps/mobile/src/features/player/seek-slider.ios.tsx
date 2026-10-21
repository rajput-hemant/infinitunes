import { Host, Slider } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import { useRef } from "react";

import { SLIDER_HOST } from "./seek-slider-props";
import type { SeekSliderProps } from "./seek-slider-props";

/** A SwiftUI `Slider`: only values the listener drags to count as a scrub. */
export function SeekSlider({
  value,
  max,
  onScrub,
  onScrubEnd,
  colors,
}: SeekSliderProps) {
  const editing = useRef(false);

  return (
    <Host style={SLIDER_HOST}>
      <Slider
        value={value}
        min={0}
        max={max}
        modifiers={colors ? [tint(colors.active)] : undefined}
        onEditingChanged={(isEditing) => {
          editing.current = isEditing;
          if (!isEditing) onScrubEnd();
        }}
        onValueChange={(next) => {
          if (editing.current) onScrub(next);
        }}
      />
    </Host>
  );
}
