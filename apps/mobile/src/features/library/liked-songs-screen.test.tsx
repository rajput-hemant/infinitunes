import { resetFavoriteOverlay } from "@infinitunes/core/react/optimistic-favorite";
import { resetPlaylistOverlay } from "@infinitunes/core/react/optimistic-playlists";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { signInAs } from "~/test/session-mock";

import {
  catalogAnswering,
  favoriteLists,
  songNamed,
  trpcClient,
} from "./library-test-support";
import { LikedSongsScreen } from "./liked-songs-screen";
import { renderLibrary } from "./render-library";

jest.mock("~/lib/trpc", () => require("./library-test-support"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock(
  "react-native-gesture-handler/ReanimatedSwipeable",
  () => require("./library-ui-mocks").swipeable,
);
jest.mock(
  "~/components/ui/skeleton",
  () => require("./library-ui-mocks").skeleton,
);

const catalog = {
  a: songNamed("a", "First Like"),
  b: songNamed("b", "Second Like"),
  c: songNamed("c", "Third Like"),
};

function renderLikedSongs() {
  return renderLibrary({ index: LikedSongsScreen, login: () => null });
}

beforeEach(async () => {
  await act(async () => signInAs("alice"));
  trpcClient.user.getUserFavorites.query.mockResolvedValue(
    favoriteLists({ songs: ["a", "b", "c"] }),
  );
  trpcClient.song.details.query.mockImplementation(catalogAnswering(catalog));
});

afterEach(() => {
  resetFavoriteOverlay();
  resetPlaylistOverlay();
  jest.restoreAllMocks();
});

describe("LikedSongsScreen", () => {
  it("asks a signed-out listener to sign in", async () => {
    await act(async () => signInAs(null));
    const router = await renderLikedSongs();

    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));

    expect(router.getPathname()).toBe("/login");
    expect(trpcClient.user.getUserFavorites.query).not.toHaveBeenCalled();
  });

  it("shows a skeleton while the songs load", async () => {
    trpcClient.song.details.query.mockReturnValue(new Promise(() => {}));
    await renderLikedSongs();

    expect(await screen.findByLabelText("Loading")).toBeOnTheScreen();
  });

  it("lists liked songs with the newest like first", async () => {
    await renderLikedSongs();

    await screen.findByText("Third Like");
    const titles = screen
      .getAllByText(/Like$/)
      .map((node) => node.props.children);
    expect(titles).toEqual(["Third Like", "Second Like", "First Like"]);
    expect(screen.getByText("3 songs")).toBeOnTheScreen();
  });

  it("says so when nothing is liked yet", async () => {
    trpcClient.user.getUserFavorites.query.mockResolvedValue(undefined);
    await renderLikedSongs();

    expect(await screen.findByText("No liked songs yet")).toBeOnTheScreen();
  });

  it("says how many saved songs did not load", async () => {
    trpcClient.song.details.query.mockImplementation(
      catalogAnswering({ a: catalog.a, c: catalog.c }),
    );
    await renderLikedSongs();

    expect(await screen.findByText("Third Like")).toBeOnTheScreen();
    expect(screen.getByText(/1 song couldn't load/)).toBeOnTheScreen();
  });

  it("shows an error with a retry when the music service is down", async () => {
    // The shared chunk loader logs each failed chunk.
    jest.spyOn(console, "error").mockImplementation(() => {});
    trpcClient.song.details.query.mockRejectedValue(new Error("bad gateway"));
    await renderLikedSongs();

    await fireEvent.press(
      await screen.findByRole("button", { name: "Try again" }),
    );

    expect(trpcClient.song.details.query.mock.calls.length).toBeGreaterThan(1);
  });

  it("hides a song at once when it is unliked", async () => {
    await renderLikedSongs();
    await screen.findByText("Second Like");

    await fireEvent.press(
      screen.getAllByRole("button", { name: "Unlike" })[1]!,
    );

    expect(screen.queryByText("Second Like")).toBeNull();
    expect(trpcClient.user.removeFromFavorites.mutate).toHaveBeenCalledWith({
      type: "song",
      token: "b",
    });
  });

  it("brings the song back with a toast when unliking fails", async () => {
    trpcClient.user.removeFromFavorites.mutate.mockRejectedValue(
      new Error("Could not save"),
    );
    await renderLikedSongs();
    await screen.findByText("Second Like");

    await fireEvent.press(
      screen.getAllByRole("button", { name: "Unlike" })[1]!,
    );

    expect(await screen.findByText("Second Like")).toBeOnTheScreen();
    expect(toast.error).toHaveBeenCalledWith("Could not save");
  });
});
