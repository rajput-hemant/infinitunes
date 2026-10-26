import { detailHeaderOptions } from "./detail-header-options";

jest.mock("~/lib/platform", () => ({
  hasHeaderBarItems: true,
  hasLiquidGlass: true,
  hasTabBarAccessory: true,
}));

const item = {
  name: "Udta Teer",
  type: "album",
  url: "https://www.jiosaavn.com/album/udta-teer/LHgqn,SRpyA_",
} as const;

describe("detailHeaderOptions on iOS 26", () => {
  it("puts Share and a native UIMenu side by side, with the entries' actions", () => {
    const addToQueue = jest.fn();
    const pick = jest.fn();
    const items = detailHeaderOptions(item, undefined, {
      title: "Udta Teer",
      entries: [
        {
          id: "add-to-queue",
          title: "Add to Queue",
          image: "text.line.last.and.arrowtriangle.forward",
          run: addToQueue,
        },
        {
          id: "add-to-playlist",
          title: "Add to Playlist",
          image: "music.note.list",
          subactions: [
            { id: "playlist:1", title: "Mine", state: "on", run: pick },
          ],
        },
      ],
    }).unstable_headerRightItems?.({ canGoBack: true });

    expect(items?.map((entry) => entry.type)).toEqual(["button", "menu"]);
    expect(items?.[0]).toMatchObject({ label: "Share Udta Teer" });
    const menu = items?.[1];
    if (menu?.type !== "menu") throw new Error("no menu item");
    expect(menu).toMatchObject({
      label: "More actions for Udta Teer",
      accessibilityLabel: "More actions for Udta Teer",
      icon: { type: "sfSymbol", name: "ellipsis" },
      menu: { title: "Udta Teer" },
    });
    const [queue, playlist] = menu.menu.items;
    if (queue?.type !== "action" || playlist?.type !== "submenu") {
      throw new Error("unexpected menu shape");
    }
    queue.onPress();
    expect(addToQueue).toHaveBeenCalledTimes(1);
    const [mine] = playlist.items;
    if (mine?.type !== "action") throw new Error("no playlist action");
    expect(mine.state).toBe("on");
    mine.onPress();
    expect(pick).toHaveBeenCalledTimes(1);
  });

  it("has just Share while the page has no menu, and nothing before the item", () => {
    expect(
      detailHeaderOptions(item).unstable_headerRightItems?.({
        canGoBack: true,
      }),
    ).toHaveLength(1);
    expect(detailHeaderOptions().unstable_headerRightItems).toBeUndefined();
  });
});
