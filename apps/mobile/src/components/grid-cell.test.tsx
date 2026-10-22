import { render, screen } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { GRID_GAP, gridCardWidth } from "~/lib/use-grid-card-width";
import { sizes } from "~/theme/tokens";

import { GridCell } from "./grid-cell";

describe("GridCell", () => {
  it("puts the page gutter on the outer logical edge, so RTL keeps it outside", async () => {
    await render(
      <>
        <GridCell index={0} columns={3}>
          <Text>first</Text>
        </GridCell>
        <GridCell index={1} columns={3}>
          <Text>middle</Text>
        </GridCell>
        <GridCell index={2} columns={3}>
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

  it.each([4, 6])(
    "keeps one gap between every pair of %i columns",
    async (columns) => {
      const width = 1000;
      const card = gridCardWidth(width, columns);
      await render(
        <>
          {Array.from({ length: columns }, (_, index) => (
            <GridCell key={index} index={index} columns={columns}>
              <Text>{`card ${index}`}</Text>
            </GridCell>
          ))}
        </>,
      );
      // A card's left edge: its cell's start plus the start inset (the last sits on the end).
      const left = (index: number) => {
        const style = StyleSheet.flatten(
          screen.getByText(`card ${index}`).parent?.props.style,
        );
        const cell = (index * width) / columns;
        return style.paddingEnd === undefined
          ? cell + style.paddingStart
          : cell + width / columns - style.paddingEnd - card;
      };
      for (let index = 1; index < columns; index++) {
        expect(left(index) - left(index - 1)).toBeCloseTo(card + GRID_GAP);
      }
    },
  );
});
