import { resetFavoriteOverlay } from "@infinitunes/core/react/optimistic-favorite";
import { resetPlaylistOverlay } from "@infinitunes/core/react/optimistic-playlists";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";
import type { AlertButton } from "react-native";
import { toast } from "sonner-native";

import { signInAs } from "~/test/session-mock";

import {
  catalogAnswering,
  deferred,
  songNamed,
  trpcClient,
  userPlaylist,
} from "./library-test-support";
import { PlaylistScreen } from "./playlist-screen";
import { chooseMenuAction, renderLibrary } from "./render-library";

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
  a: songNamed("a", "Opening Number"),
  b: songNamed("b", "Middle Song"),
  c: songNamed("c", "Closing Time"),
};
const playlist = userPlaylist({
  id: "pl-1",
  name: "Road Trip",
  description: "Windows down",
  songs: ["a", "b", "c"],
});

function renderPlaylist(id = "pl-1") {
  return renderLibrary(
    { "me/playlist/[id]": PlaylistScreen },
    `/me/playlist/${id}`,
  );
}

beforeEach(async () => {
  await act(async () => signInAs("alice"));
  trpcClient.user.getUserPlaylists.query.mockResolvedValue([playlist]);
  trpcClient.song.details.query.mockImplementation(catalogAnswering(catalog));
});

afterEach(() => {
  resetPlaylistOverlay();
  resetFavoriteOverlay();
});

describe("PlaylistScreen", () => {
  it("asks a signed-out listener to sign in", async () => {
    await act(async () => signInAs(null));
    await renderPlaylist();

    expect(screen.getByRole("button", { name: "Sign in" })).toBeOnTheScreen();
  });

  it("lists the songs in the playlist's own order", async () => {
    await renderPlaylist();

    await screen.findByText("Opening Number");
    const titles = screen
      .getAllByText(/Number|Song|Time/)
      .map((node) => node.props.children);
    expect(titles).toEqual(["Opening Number", "Middle Song", "Closing Time"]);
    expect(screen.getByText("Windows down")).toBeOnTheScreen();
    expect(screen.getByText("3 songs")).toBeOnTheScreen();
  });

  it("says so when the playlist is empty", async () => {
    trpcClient.user.getUserPlaylists.query.mockResolvedValue([
      { ...playlist, songs: [] },
    ]);
    await renderPlaylist();

    expect(await screen.findByText("Nothing to see here")).toBeOnTheScreen();
  });

  it("says so when the playlist does not exist", async () => {
    await renderPlaylist("someone-elses");

    expect(await screen.findByText("Playlist not found")).toBeOnTheScreen();
  });

  it("shows an error with a retry when the songs cannot load", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    trpcClient.song.details.query.mockRejectedValueOnce(new Error("down"));
    await renderPlaylist();

    await fireEvent.press(
      await screen.findByRole("button", { name: "Try again" }),
    );

    expect(await screen.findByText("Opening Number")).toBeOnTheScreen();
  });
});

describe("removing a song", () => {
  it("hides it at once and removes it at its position", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    trpcClient.user.removeSongsFromPlaylist.mutate.mockReturnValue(
      write.promise,
    );
    await renderPlaylist();
    await screen.findByText("Middle Song");

    await fireEvent.press(
      screen.getAllByRole("button", { name: "Remove" })[1]!,
    );

    expect(screen.queryByText("Middle Song")).toBeNull();
    expect(screen.getByText("Opening Number")).toBeOnTheScreen();
    expect(trpcClient.user.removeSongsFromPlaylist.mutate).toHaveBeenCalledWith(
      {
        playlistId: "pl-1",
        index: 1,
        songId: "b",
      },
    );

    trpcClient.user.getUserPlaylists.query.mockResolvedValue([
      { ...playlist, songs: ["a", "c"] },
    ]);
    await act(async () => write.resolve(userPlaylist()));

    expect(screen.queryByText("Middle Song")).toBeNull();
    expect(await screen.findByText("2 songs")).toBeOnTheScreen();
  });

  it("removes from the song's menu too", async () => {
    await renderPlaylist();
    await screen.findByText("Closing Time");

    await chooseMenuAction("More actions for Closing Time", "remove");

    expect(screen.queryByText("Closing Time")).toBeNull();
    expect(trpcClient.user.removeSongsFromPlaylist.mutate).toHaveBeenCalledWith(
      {
        playlistId: "pl-1",
        index: 2,
        songId: "c",
      },
    );
  });

  it("brings the song back with a toast when the write fails", async () => {
    trpcClient.user.removeSongsFromPlaylist.mutate.mockRejectedValue(
      new Error("Could not remove"),
    );
    await renderPlaylist();
    await screen.findByText("Middle Song");

    await fireEvent.press(
      screen.getAllByRole("button", { name: "Remove" })[1]!,
    );

    expect(await screen.findByText("Middle Song")).toBeOnTheScreen();
    expect(toast.error).toHaveBeenCalledWith("Could not remove");
  });
});

describe("deleting the playlist from its own screen", () => {
  it("leaves the screen and deletes the playlist once confirmed", async () => {
    const alert = jest.spyOn(Alert, "alert");
    const app = await renderLibrary({
      index: () => null,
      "me/playlist/[id]": PlaylistScreen,
    });
    await act(async () => router.push("/me/playlist/pl-1"));
    await screen.findByText("Opening Number");

    await chooseMenuAction("Playlist options", "delete");
    const buttons: AlertButton[] = alert.mock.calls[0]![2]!;
    await act(async () =>
      buttons.find(({ text }) => text === "Delete")?.onPress?.(),
    );

    expect(app.getPathname()).toBe("/");
    expect(trpcClient.user.deletePlaylist.mutate).toHaveBeenCalledWith({
      playlistId: "pl-1",
    });
    alert.mockRestore();
  });
});
