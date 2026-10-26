import {
  rawArtist,
  rawEpisode,
  rawPlaylist,
  rawShow,
} from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";

import { renderStack } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { favoritesRow } from "~/test/user-library";

import { LikedCollectionScreen } from "./liked-collection-screen";

beforeEach(async () => {
  await act(async () => signInAs("alice"));
});

describe("liked playlists", () => {
  const playlists = {
    "pl-1": rawPlaylist({ id: "pl-1", title: "Older Mix" }),
    "pl-2": rawPlaylist({
      id: "pl-2",
      title: "Newer Mix",
      perma_url: "https://www.jiosaavn.com/featured/newer/pl2_",
    }),
  };

  it("lists them newest first, and opens one", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ playlists: ["pl-1", "pl-2"] }),
    );
    procedure("playlist.details").mockImplementation(
      async ({ id }) =>
        playlists[id as keyof typeof playlists] ?? rawPlaylist(),
    );
    const router = await renderStack({
      index: () => <LikedCollectionScreen kind="playlists" />,
      "playlist/[name]/[token]": () => null,
    });

    await screen.findByText("Newer Mix");
    expect(
      screen.getAllByText(/Mix$/).map((node) => node.props.children),
    ).toEqual(["Newer Mix", "Older Mix"]);
    expect(procedure("playlist.details")).toHaveBeenCalledWith({ id: "pl-2" });

    await fireEvent.press(screen.getByText("Newer Mix"));
    expect(router.getPathname()).toBe("/playlist/newer/pl2_");
  });

  it("says so when none is liked", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(null);
    await renderStack({
      index: () => <LikedCollectionScreen kind="playlists" />,
    });

    expect(await screen.findByText("No liked playlists yet")).toBeOnTheScreen();
    expect(
      screen.getByText("Tap the heart on a playlist and it will show up here."),
    ).toBeOnTheScreen();
  });
});

describe("liked artists", () => {
  it("opens an artist on its page", async () => {
    const artist = rawArtist();
    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ artists: [artist.artistId] }),
    );
    procedure("artist.details").mockResolvedValue(artist);
    const router = await renderStack({
      index: () => <LikedCollectionScreen kind="artists" />,
      "artist/[name]/[token]/index": () => null,
      "artist/[name]/[token]/[tab]": () => null,
    });

    await fireEvent.press(await screen.findByText("Flipperachi"));

    expect(procedure("artist.details")).toHaveBeenCalledWith({
      id: artist.artistId,
    });
    expect(router.getPathname()).toMatch(/^\/artist\/[^/]+\/[^/]+(\/songs)?$/);
  });
});

describe("liked podcasts", () => {
  it("finds each show through its episodes, and opens it", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ podcasts: ["5555"] }),
    );
    procedure("show.episodes").mockResolvedValue([rawEpisode("9001")]);
    procedure("show.details").mockResolvedValue(rawShow());
    const router = await renderStack({
      index: () => <LikedCollectionScreen kind="shows" />,
      "show/[name]/[season]/[token]": () => null,
    });

    await fireEvent.press(
      await screen.findByText("The Ranveer Show & Friends"),
    );

    expect(procedure("show.episodes")).toHaveBeenCalledWith({ id: "5555" });
    expect(router.getPathname()).toBe("/show/the-ranveer-show/2/mXtDJ4Yd2Sw_");
  });

  it("is an outage, not an empty list, when no podcast can be found", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ podcasts: ["5555", "6666"] }),
    );
    procedure("show.episodes").mockResolvedValue([]);
    await renderStack({
      index: () => <LikedCollectionScreen kind="shows" />,
    });

    expect(
      await screen.findByRole("button", { name: "Try again" }),
    ).toBeOnTheScreen();
    expect(screen.queryByText("No liked podcasts yet")).toBeNull();
  });
});
