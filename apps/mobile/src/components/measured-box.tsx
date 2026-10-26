import { useState } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

export type Box = { width: number; height: number };

/**
 * Hands its children the size this box was laid out at. iOS `MenuView` hosts
 * (`matchContents`) hug their child and ignore `width: "100%"`, so a menu that
 * must fill a slot (a queue row, a header pill) gives its child these numbers;
 * the box centres whatever it renders. `undefined` until the first layout.
 */
export function MeasuredBox({
  style,
  testID,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: (box: Box | undefined) => ReactNode;
}) {
  const [box, setBox] = useState<Box>();
  return (
    <View
      testID={testID}
      style={[{ alignItems: "center", justifyContent: "center" }, style]}
      onLayout={({ nativeEvent: { layout } }) => {
        setBox((previous) =>
          previous?.width === layout.width && previous.height === layout.height
            ? previous
            : { width: layout.width, height: layout.height },
        );
      }}
    >
      {children(box)}
    </View>
  );
}
