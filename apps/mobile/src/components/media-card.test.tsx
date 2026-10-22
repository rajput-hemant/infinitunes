import { toCardItem } from "@infinitunes/types";
import { rawAlbum } from "@infinitunes/types/fixtures";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";

import { renderScreen } from "~/test/render";
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

  it("is not clipped on iOS, which has no ripple", async () => {
    await renderScreen(<MediaCard item={toCardItem(rawAlbum())} />, {
      routes: { "album/[name]/[token]": () => null },
    });

    expect(screen.getByRole("link", { name: /^Udta Teer/ })).toHaveProp(
      "className",
      "gap-2",
    );
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
