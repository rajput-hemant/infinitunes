import { fireEvent, screen } from "@testing-library/react-native";
import { Platform, StyleSheet, View } from "react-native";

import { renderScreen } from "~/test/render";
import { sizes } from "~/theme/tokens";

import { Button } from "./button";

/** The nearest host (native) view above `node`. */
function hostParent(node: ReturnType<typeof screen.getByRole>) {
  let parent = node.parent;
  while (parent && typeof parent.type !== "string") parent = parent.parent;
  return parent;
}

describe("Button on Android", () => {
  beforeEach(() => jest.replaceProperty(Platform, "OS", "android"));

  it("reaches the 48dp target with slop on the outermost, unclipped pressable", async () => {
    await renderScreen(
      <View testID="host">
        <Button label="Save" onPress={jest.fn()} />
      </View>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    const slop = button.props.hitSlop;
    expect(sizes.ctl + slop.top + slop.bottom).toBe(sizes.touch);
    expect(StyleSheet.flatten(button.props.style)).toMatchObject({
      minHeight: sizes.ctl,
      overflow: "hidden",
    });
    // Android drops touches outside a parent's laid-out bounds: slop on a
    // pressable inside a same-size wrapper would never fire.
    expect(hostParent(button)?.props.testID).toBe("host");
  });

  it("presses through the corner morph", async () => {
    const onPress = jest.fn();
    await renderScreen(<Button label="Save" onPress={onPress} />);

    const button = screen.getByRole("button", { name: "Save" });
    await fireEvent(button, "pressIn");
    await fireEvent(button, "pressOut");
    await fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
