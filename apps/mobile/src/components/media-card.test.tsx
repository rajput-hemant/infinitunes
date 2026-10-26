import { toCardItem } from "@infinitunes/types";
import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";

import { playerStore } from "~/playback/player-store";
import { chooseCardAction, renderScreen } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { titleLineTexts } from "~/test/title-row";
import { procedure } from "~/test/trpc-mock";

import { MediaCard } from "./media-card";

describe("MediaCard", () => {
  it("prefetches the album's details when the card is pressed in", async () => {
    const album = rawAlbum({
      title: "Rock Roll",
      perma_url: "https://www.jiosaavn.com/album/rock-roll/LHgqn,SRpyA_",
    });
    procedure("album.details").mockResolvedValue(album);
    await renderScreen(<MediaCard item={toCardItem(album)} />, {
      routes: { "album/[name]/[token]": () => null },
    });

    fireEvent(screen.getByRole("link", { name: /Rock Roll/ }), "pressIn");

    await waitFor(() =>
      expect(procedure("album.details")).toHaveBeenCalledWith({
        token: "LHgqn,SRpyA_",
      }),
    );
  });

  it("shows the explicit badge on the title line, before the title", async () => {
    await renderScreen(
      <MediaCard item={toCardItem(rawAlbum({ explicit_content: "1" }))} />,
      { routes: { "album/[name]/[token]": () => null } },
    );

    // Only the badge and the title sit on the title line, badge first.
    expect(titleLineTexts(screen.getByText("Udta Teer"))).toEqual([
      "E",
      "Udta Teer",
    ]);
  });

  it("is not clipped on iOS, which has no ripple", async () => {
    await renderScreen(<MediaCard item={toCardItem(rawAlbum())} />, {
      routes: { "album/[name]/[token]": () => null },
    });

    expect(screen.getByRole("link", { name: /^Udta Teer/ })).toHaveProp(
      "className",
      "gap-2",
    );
  });

  it("offers an album Apple Music's entries, and Shuffle shuffles it", async () => {
    const album = rawAlbum({
      perma_url: "https://www.jiosaavn.com/album/rock-roll/LHgqn,SRpyA_",
      list: [rawSong({ id: "s1" }), rawSong({ id: "s2" })],
    });
    procedure("album.details").mockResolvedValue(album);
    // Android mounts its menu on the long press; iOS wraps the card in the system menu.
    jest.replaceProperty(Platform, "OS", "android");
    await renderScreen(<MediaCard item={toCardItem(album)} />, {
      routes: { "album/[name]/[token]": () => null },
    });
    const card = screen.getByRole("link", { name: /^Udta Teer/ });

    // Signed out: no Add to Playlist or Favourite.
    expect(
      card.props.accessibilityActions.map(
        (action: { label: string }) => action.label,
      ),
    ).toEqual(["Play", "Shuffle", "Play Next", "Add to Queue", "Share"]);
    await chooseCardAction(card, "shuffle");

    await waitFor(() => expect(playerStore.getState().queue).toHaveLength(2));
    expect(playerStore.getState().currentIndex).toBe(0);
  });

  it("adds Favourite when signed in (Add to Playlist is a submenu)", async () => {
    signInAs("u1");
    const album = rawAlbum();
    await renderScreen(<MediaCard item={toCardItem(album)} />, {
      routes: { "album/[name]/[token]": () => null },
    });

    expect(
      screen
        .getByRole("link", { name: /^Udta Teer/ })
        .props.accessibilityActions.map(
          (action: { label: string }) => action.label,
        ),
    ).toEqual([
      "Play",
      "Shuffle",
      "Play Next",
      "Add to Queue",
      "Favourite",
      "Share",
    ]);
  });

  it("ripples within its corners on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await renderScreen(<MediaCard item={toCardItem(rawAlbum())} />, {
      routes: { "album/[name]/[token]": () => null },
    });

    const card = screen.getByRole("link", { name: /^Udta Teer/ });
    expect(card.props.nativeForegroundAndroid).toMatchObject({
      type: "RippleAndroid",
      borderless: false,
    });
    expect(card).toHaveProp(
      "className",
      expect.stringContaining("overflow-hidden rounded-t-md"),
    );
  });
});
