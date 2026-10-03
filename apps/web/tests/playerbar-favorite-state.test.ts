import { describe, expect, it } from "bun:test";

const ROOT_LAYOUT = new URL("../app/(root)/layout.tsx", import.meta.url);
const PLAYER_WRAPPER = new URL(
  "../components/player-wrapper.tsx",
  import.meta.url,
);
const PLAYER = new URL("../components/player.tsx", import.meta.url);
const MORE_BUTTON = new URL(
  "../components/song-list/more-button.tsx",
  import.meta.url,
);

describe("playerbar favorite-state and Add-label plumbing regression", () => {
  it("root layout fetches getUserFavorites and passes favorites to PlayerWrapper", async () => {
    const source = await Bun.file(ROOT_LAYOUT).text();

    expect(source).toContain("getUserFavorites");
    expect(source).toContain("getUserFavorites()");
    expect(source).toContain("favorites={userFavorites}");
  });

  it("player-wrapper accepts favorites prop and passes it to Player", async () => {
    const source = await Bun.file(PLAYER_WRAPPER).text();

    expect(source).toContain("favorites?: Favorite;");
    expect(source).toContain("favorites={favorites}");
  });

  it("player accepts favorites in PlayerProps and PlayerInner, and passes favorites to TileMoreButton", async () => {
    const source = await Bun.file(PLAYER).text();

    expect(source).toContain("favorites?: Favorite;");
    expect(source).toContain(
      "function PlayerInner({ user, playlists, favorites }: PlayerProps)",
    );
    expect(source).toContain("<TileMoreButton");
    expect(source).toContain("favorites={favorites}");
  });

  it("more-button uses useOptimistic and startTransition with router.refresh", async () => {
    const source = await Bun.file(MORE_BUTTON).text();

    expect(source).toContain("React.useOptimistic");
    expect(source).toContain("favorites?.songs.includes(item.id)");
    expect(source).toContain("React.startTransition");
    expect(source).toContain("setOptimisticFavorite(!isFavorite)");
    expect(source).toContain("router.refresh()");
  });
});
