import { toCardItem } from "@infinitunes/types";
import { rawAlbum } from "@infinitunes/types/fixtures";
import { screen } from "@testing-library/react-native";
import { Dimensions } from "react-native";

import { renderScreen } from "~/test/render";
import { art, playerArtSize, sizes, space } from "~/theme/tokens";

import { Shelf } from "./shelf";

const items = [
  toCardItem(rawAlbum({ id: "1", title: "One" })),
  toCardItem(rawAlbum({ id: "2", title: "Two" })),
];

type JsonNode = { props: Record<string, unknown>; children: unknown[] | null };

/** The rendered scroll views that snap. */
function snapping() {
  const found: JsonNode[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    const element = node as JsonNode;
    if (typeof element.props.snapToInterval === "number") found.push(element);
    element.children?.forEach(walk);
  };
  walk(screen.toJSON());
  return found;
}

describe("Shelf", () => {
  it("snaps the hero carousel one card at a time, leaving a peek of the next", async () => {
    await renderScreen(<Shelf variant="hero" items={items} />);
    const { width } = Dimensions.get("window");
    const hero = Math.min(
      width - 2 * sizes.page - space.md - art.tile,
      playerArtSize(width),
    );

    const [list] = snapping();
    expect(list?.props.snapToInterval).toBe(hero + space.md);
    expect(list?.props.decelerationRate).toBe("fast");
  });

  it("scrolls a card shelf freely", async () => {
    await renderScreen(<Shelf title="New" items={items} />);

    expect(snapping()).toHaveLength(0);
  });
});
