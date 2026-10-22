import { fireEvent, screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";
import { sizes, space } from "~/theme/tokens";

import { ChipRow, revealOffset } from "./chip-row";

describe("revealOffset", () => {
  const chip = { x: 400, width: 80 };

  it("leaves a chip that shows whole where it is", () => {
    expect(revealOffset(150, 390, chip)).toBeUndefined();
  });

  it("scrolls a chip past the end into view with the gutter after it", () => {
    expect(revealOffset(0, 390, chip)).toBe(400 + 80 + sizes.page - 390);
  });

  it("scrolls a chip before the start into view with the gutter before it", () => {
    expect(revealOffset(450, 390, chip)).toBe(400 - sizes.page);
    expect(revealOffset(10, 390, { x: 16, width: 60 })).toBe(0);
  });
});

/** The row's scroll view: its tablist, which is not an accessible element itself. */
function chipScroller() {
  let node = screen.getByRole("tab", { name: "All" }).parent;
  while (node && node.props.accessibilityRole !== "tablist") node = node.parent;
  if (!node) throw new Error("The chips have no tablist");
  return node;
}

describe("ChipRow", () => {
  const chips = ["All", "Songs", "Albums", "Artists", "Playlists"].map(
    (label, index) => ({
      key: label,
      label,
      selected: index === 4,
      onPress: jest.fn(),
    }),
  );

  it("fades only its trailing edge (Android's native fading edge)", async () => {
    await renderScreen(<ChipRow chips={chips} tabs />);

    expect(chipScroller()).toHaveProp("fadingEdgeLength", {
      start: 0,
      end: space.xl,
    });
  });

  // The scroll itself is native; `revealOffset` above pins where it goes.
  it("places the selected chip once the row and chip are measured", async () => {
    await renderScreen(<ChipRow chips={chips} tabs />);

    fireEvent(chipScroller(), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 48 } },
    });
    fireEvent(
      screen.getByRole("tab", { name: "Playlists" }).parent!,
      "layout",
      {
        nativeEvent: { layout: { x: 400, y: 8, width: 80, height: 32 } },
      },
    );

    expect(screen.getByRole("tab", { name: "Playlists" })).toBeSelected();
  });
});
