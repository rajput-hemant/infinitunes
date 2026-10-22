import { useState } from "react";
import { Pressable } from "react-native";

import { Text } from "~/components/ui/text";
import { usePalette } from "~/theme/use-palette";

/** Lines shown before the listener asks for the rest. */
const PREVIEW_LINES = 3;

/**
 * A show's or episode's description: three lines, tapped open to the whole
 * text (a podcast's can run to pages and would push its episodes below the
 * fold). Short text is plain, with nothing to toggle.
 */
export function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const palette = usePalette();
  const toggles = clamped || expanded;

  return (
    <Pressable
      onPress={toggles ? () => setExpanded((open) => !open) : undefined}
      disabled={!toggles}
      accessibilityRole={toggles ? "button" : undefined}
      accessibilityState={toggles ? { expanded } : undefined}
      android_ripple={{ color: palette["fill-2"], foreground: true }}
      className="gap-1 px-page active:opacity-70"
    >
      <Text
        tone="muted"
        selectable={!toggles}
        numberOfLines={expanded ? undefined : PREVIEW_LINES}
        onTextLayout={({ nativeEvent }) => {
          // ponytail: a clamped layout reports at most the preview's lines, so
          // exactly three lines gets a toggle that reveals nothing; measure
          // unclamped off-screen if that ever matters.
          if (!expanded) setClamped(nativeEvent.lines.length >= PREVIEW_LINES);
        }}
      >
        {text}
      </Text>
      {toggles ? (
        <Text variant="subhead" tone="primary">
          {expanded ? "Read Less" : "Read More"}
        </Text>
      ) : null}
    </Pressable>
  );
}
