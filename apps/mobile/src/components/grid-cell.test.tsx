import { render, screen } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { sizes } from "~/theme/tokens";

import { GridCell } from "./grid-cell";

describe("GridCell", () => {
  it("puts the page gutter on the outer logical edge, so RTL keeps it outside", async () => {
    await render(
      <>
        <GridCell index={0}>
          <Text>first</Text>
        </GridCell>
        <GridCell index={1}>
          <Text>second</Text>
        </GridCell>
      </>,
    );

    const first = StyleSheet.flatten(
      screen.getByText("first").parent?.props.style,
    );
    const second = StyleSheet.flatten(
      screen.getByText("second").parent?.props.style,
    );
    expect(first).toMatchObject({ paddingStart: sizes.page });
    expect(second).toMatchObject({ paddingEnd: sizes.page });
    for (const style of [first, second]) {
      expect(style).not.toHaveProperty("paddingLeft");
      expect(style).not.toHaveProperty("paddingRight");
    }
  });
});
