import type { MediaType } from "@infinitunes/types";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Pressable, Text } from "react-native";

import { renderStack } from "~/test/render";

import { useOpenEntity } from "./use-open-entity";

const ALBUM_URL = "https://www.jiosaavn.com/album/udta-teer/LHgqn_";

function Opener({
  type = "album",
  url = ALBUM_URL,
}: {
  type?: MediaType;
  url?: string;
}) {
  const openEntity = useOpenEntity();
  return (
    <Pressable accessibilityRole="button" onPress={() => openEntity(type, url)}>
      <Text>Open</Text>
    </Pressable>
  );
}

function spyOnNavigation() {
  return {
    push: jest.spyOn(router, "push").mockImplementation(() => {}),
    dismissAll: jest.spyOn(router, "dismissAll").mockImplementation(() => {}),
  };
}

afterEach(() => jest.restoreAllMocks());

describe("useOpenEntity", () => {
  it("pushes the screen onto the tab's own stack from inside a tab", async () => {
    await renderStack({
      "(tabs)/index": () => <Opener />,
    });
    const { push, dismissAll } = spyOnNavigation();

    await fireEvent.press(screen.getByRole("button", { name: "Open" }));

    expect(push).toHaveBeenCalledWith({
      pathname: "/album/[name]/[token]",
      params: { name: "udta-teer", token: "LHgqn_" },
    });
    expect(dismissAll).not.toHaveBeenCalled();
  });

  it("closes the player or queue first, so the screen opens in the tab beneath", async () => {
    await renderStack(
      { "(tabs)/index": () => null, player: () => <Opener /> },
      "/player",
    );
    const { push, dismissAll } = spyOnNavigation();
    const order: string[] = [];
    dismissAll.mockImplementation(() => void order.push("dismissAll"));
    push.mockImplementation(() => void order.push("push"));

    await fireEvent.press(screen.getByRole("button", { name: "Open" }));

    expect(order).toEqual(["dismissAll", "push"]);
  });

  it("does nothing for an item that has no screen, and keeps modals open", async () => {
    await renderStack(
      { "(tabs)/index": () => null, player: () => <Opener type="channel" /> },
      "/player",
    );
    const { push, dismissAll } = spyOnNavigation();

    await fireEvent.press(screen.getByRole("button", { name: "Open" }));

    expect(push).not.toHaveBeenCalled();
    expect(dismissAll).not.toHaveBeenCalled();
  });

  it("does nothing for a link that is not a JioSaavn one", async () => {
    await renderStack({
      "(tabs)/index": () => <Opener url="https://example.com/album/a/b" />,
    });
    const { push } = spyOnNavigation();

    await fireEvent.press(screen.getByRole("button", { name: "Open" }));

    expect(push).not.toHaveBeenCalled();
  });
});
