import { Host, Slider } from "@expo/ui/swift-ui";
import { useRef } from "react";

import type { SeekSliderProps } from "./seek-slider-props";

/** A SwiftUI `Slider`: only values the listener drags to count as a scrub. */
export function SeekSlider({
  value,
  max,
  onScrub,
  onScrubEnd,
}: SeekSliderProps) {
  const editing = useRef(false);

  return (
    <Host style={{ height: 32 }}>
      <Slider
        value={value}
        min={0}
        max={max}
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
