import { fireEvent, screen } from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";
import type { ReactTestInstance } from "react-test-renderer";

import { renderScreen } from "~/test/render";
import { sizes } from "~/theme/tokens";

import { Button } from "./button";

/** Whether any host view above `node` clips its children. */
function hasClippingAncestor(node: ReactTestInstance): boolean {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (
      typeof parent.type === "string" &&
      StyleSheet.flatten(parent.props.style)?.overflow === "hidden"
    ) {
      return true;
    }
  }
  return false;
}

describe("Button on Android", () => {
  beforeEach(() => jest.replaceProperty(Platform, "OS", "android"));

  it("reaches the 48dp target with slop on the outermost, unclipped pressable", async () => {
    await renderScreen(<Button label="Save" onPress={jest.fn()} />);

    const button = screen.getByRole("button", { name: "Save" });
    const slop = button.props.hitSlop;
    expect(sizes.ctl + slop.top + slop.bottom).toBe(sizes.touch);
    expect(StyleSheet.flatten(button.props.style)).toMatchObject({
      minHeight: sizes.ctl,
      overflow: "hidden",
    });
    // Android drops touches outside an `overflow: hidden` parent: slop on a
    // child of the clip would never fire.
    expect(hasClippingAncestor(button)).toBe(false);
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
