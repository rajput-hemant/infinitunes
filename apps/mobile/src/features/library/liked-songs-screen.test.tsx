import { resetFavoriteOverlay } from "@infinitunes/core/react/optimistic-favorite";
import { resetPlaylistOverlay } from "@infinitunes/core/react/optimistic-playlists";
import { act, fireEvent, screen } from "@testing-library/react-native";

import { playerStore } from "~/playback/player-store";
import { renderStack } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { favoritesRow, songNamed, catalogAnswering } from "~/test/user-library";

import { LikedSongsScreen } from "./liked-songs-screen";

const catalog = {
  a: songNamed("a", "First Like"),
  b: songNamed("b", "Second Like"),
  c: songNamed("c", "Third Like"),
};

function renderLikedSongs() {
  return renderStack({ index: LikedSongsScreen, login: () => null });
}

beforeEach(async () => {
  await act(async () => signInAs("alice"));
  procedure("user.getUserFavorites").mockResolvedValue(
    favoritesRow({ songs: ["a", "b", "c"] }),
  );
  procedure("song.details").mockImplementation(catalogAnswering(catalog));
});

const initialPlayer = playerStore.getState();

afterEach(() => {
  playerStore.setState(initialPlayer, true);
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
    expect(procedure("user.getUserFavorites")).not.toHaveBeenCalled();
  });

  it("shows a skeleton while the songs load", async () => {
    procedure("song.details").mockReturnValue(new Promise(() => {}));
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
    // The count row's compact controls.
    expect(screen.getByRole("button", { name: "Shuffle" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Play" })).toBeOnTheScreen();
  });

  it("says so when nothing is liked yet", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(null);
    await renderLikedSongs();

    expect(await screen.findByText("No liked songs yet")).toBeOnTheScreen();
  });

  it("says how many saved songs did not load", async () => {
    procedure("song.details").mockImplementation(
      catalogAnswering({ a: catalog.a, c: catalog.c }),
    );
    await renderLikedSongs();

    expect(await screen.findByText("Third Like")).toBeOnTheScreen();
    expect(screen.getByText(/1 song couldn't load/)).toBeOnTheScreen();
  });

  it("shows an error with a retry when the music service is down", async () => {
    // The shared chunk loader logs each failed chunk.
    jest.spyOn(console, "error").mockImplementation(() => {});
    procedure("song.details").mockRejectedValue(new Error("bad gateway"));
    await renderLikedSongs();

    await fireEvent.press(
      await screen.findByRole("button", { name: "Try again" }),
    );

    expect(procedure("song.details").mock.calls.length).toBeGreaterThan(1);
  });

  it("hides a song at once when it is unliked", async () => {
    await renderLikedSongs();
    await screen.findByText("Second Like");

    jest.useFakeTimers();
    await fireEvent.press(
      screen.getAllByRole("button", { name: "Unlike" })[1]!,
    );
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    jest.useRealTimers();

    expect(screen.queryByText("Second Like")).toBeNull();
    expect(procedure("user.removeFromFavorites")).toHaveBeenCalledWith({
      type: "song",
      token: "b",
    });
  });

  it("leaves an unliked song out of the count and of Play", async () => {
    // The removal never answers: the overlay alone hides the song.
    procedure("user.removeFromFavorites").mockReturnValue(
      new Promise(() => {}),
    );
    await renderLikedSongs();
    await screen.findByText("Second Like");

    jest.useFakeTimers();
    await fireEvent.press(
      screen.getAllByRole("button", { name: "Unlike" })[1]!,
    );
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    jest.useRealTimers();
    expect(screen.getByText("2 songs")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Play" }));
    expect(playerStore.getState().queue.map((entry) => entry.id)).toEqual([
      "c",
      "a",
    ]);
  });

  it("brings the song back when unliking fails", async () => {
    procedure("user.removeFromFavorites").mockRejectedValue(
      new Error("Could not save"),
    );
    await renderLikedSongs();
    await screen.findByText("Second Like");

    await fireEvent.press(
      screen.getAllByRole("button", { name: "Unlike" })[1]!,
    );

    expect(await screen.findByText("Second Like")).toBeOnTheScreen();
  });
});
