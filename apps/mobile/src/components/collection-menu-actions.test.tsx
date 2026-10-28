import { resetPlaylistOverlay } from "@infinitunes/core/react/optimistic-playlists";
import { toSongRow } from "@infinitunes/types";
import { rawEpisode, rawSong } from "@infinitunes/types/fixtures";
import { act, waitFor } from "@testing-library/react-native";
import { Directory } from "expo-file-system";
import {
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
} from "expo-notifications";
import { router } from "expo-router";
import { AppState } from "react-native";

import { pickDownloadFolder, saveTracks } from "~/lib/download";
import { cancelDownloads, startBatch } from "~/lib/download-store";
import { failureStore } from "~/lib/failure";
import { notificationPromptStore } from "~/lib/notifications";
import { preferencesStore } from "~/lib/preferences";
import { CollectionMenuBar } from "~/test/collection-menu-bar";
import { chooseMenuAction, renderWithProviders } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { playlistSummary, userPlaylist } from "~/test/user-library";

const CollectionMenu = CollectionMenuBar;

jest.mock("~/lib/download", () => ({
  pickDownloadFolder: jest.fn(),
  saveTracks: jest.fn(),
}));
jest.mock("expo-file-system", () => ({ Directory: jest.fn() }));

const rows = ["one", "two", "three"].map((id) =>
  toSongRow(rawSong({ id, title: `Song ${id}` })),
);
const trigger = "More actions for Udta Teer";
const menu = (songs = rows) => <CollectionMenu name="Udta Teer" rows={songs} />;

const initialPreferences = preferencesStore.getState();
beforeEach(() => preferencesStore.setState(initialPreferences, true));

describe("add to playlist", () => {
  // Each optimistic record expires on a long timer; a real one would keep
  // the Jest worker alive after the suite.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    resetPlaylistOverlay();
  });

  it("offers no Add to Playlist while signed out", async () => {
    await renderWithProviders(menu());

    const push = jest.spyOn(router, "push").mockImplementation(() => {});
    await chooseMenuAction(trigger, "new-playlist");

    expect(push).not.toHaveBeenCalled();
    expect(procedure("user.addSongsToPlaylist")).not.toHaveBeenCalled();
  });

  it("adds every song to the chosen playlist", async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getPlaylistDetails").mockResolvedValue(userPlaylist());
    procedure("user.getUserPlaylists").mockResolvedValue([
      playlistSummary({ id: "pl-1", name: "Road Trip" }),
    ]);
    await renderWithProviders(menu());

    // The playlists load behind the menu (the query cache notifies readers
    // on a timer); its entry exists once they have.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });

    await chooseMenuAction(trigger, "playlist:pl-1");

    expect(procedure("user.addSongsToPlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
      songs: ["one", "two", "three"],
    });
  });

  it("offers only queue actions for episodes", async () => {
    await act(async () => signInAs("alice"));
    const episodes = [toSongRow(rawEpisode("9001"))];
    await renderWithProviders(menu(episodes));

    await chooseMenuAction(trigger, "play-radio");
    await chooseMenuAction(trigger, "download-all");

    expect(procedure("radio.createStation")).not.toHaveBeenCalled();
    expect(pickDownloadFolder).not.toHaveBeenCalled();
  });
});

describe("download all", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does nothing when the listener dismisses the folder picker", async () => {
    jest.mocked(pickDownloadFolder).mockResolvedValue(null);
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await act(async () => {});

    expect(saveTracks).not.toHaveBeenCalled();
  });

  it("saves the songs into the folder at the download quality preference", async () => {
    const folder = new Directory();
    jest.mocked(pickDownloadFolder).mockResolvedValue(folder);
    jest.mocked(saveTracks).mockResolvedValue({ saved: 3, failed: 0 });
    preferencesStore.getState().setDownloadQuality("low");
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await waitFor(() => expect(saveTracks).toHaveBeenCalledTimes(1));

    expect(saveTracks).toHaveBeenCalledWith(folder, rows, "low");
  });

  it("reports how many songs failed, and nothing when all saved", async () => {
    jest.mocked(pickDownloadFolder).mockResolvedValue(new Directory());
    jest.mocked(saveTracks).mockResolvedValue({ saved: 1, failed: 2 });
    failureStore.setState({ current: null });
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await waitFor(() =>
      expect(failureStore.getState().current?.message).toBe(
        "Couldn't download 2 of 3 songs.",
      ),
    );

    failureStore.setState({ current: null });
    jest.mocked(saveTracks).mockResolvedValue({ saved: 3, failed: 0 });
    await chooseMenuAction(trigger, "download-all");
    await waitFor(() => expect(saveTracks).toHaveBeenCalledTimes(2));
    await act(async () => {});
    expect(failureStore.getState().current).toBeNull();
  });

  it("stays quiet when the listener cancelled the run", async () => {
    jest.mocked(pickDownloadFolder).mockResolvedValue(new Directory());
    jest
      .mocked(saveTracks)
      .mockResolvedValue({ saved: 0, failed: 1, cancelled: true });
    failureStore.setState({ current: null });
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await waitFor(() => expect(saveTracks).toHaveBeenCalledTimes(1));
    await act(async () => {});

    expect(failureStore.getState().current).toBeNull();
  });

  it("asks to wait while another run is going", async () => {
    startBatch(["x"], 1);
    failureStore.setState({ current: null });
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");

    expect(failureStore.getState().current?.message).toBe(
      "Another download is still running.",
    );
    expect(pickDownloadFolder).not.toHaveBeenCalled();
    cancelDownloads();
  });

  it("asks for notifications once and posts the result when it finishes", async () => {
    notificationPromptStore.setState({ asked: false });
    jest
      .mocked(getPermissionsAsync)
      .mockResolvedValue({ granted: false, canAskAgain: true } as never);
    jest.mocked(pickDownloadFolder).mockResolvedValue(new Directory());
    jest.mocked(saveTracks).mockResolvedValue({ saved: 3, failed: 0 });
    Object.assign(AppState, { currentState: "background" });
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await waitFor(() => expect(saveTracks).toHaveBeenCalledTimes(1));

    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
    // Denied: the result is not posted.
    await waitFor(() => expect(getPermissionsAsync).toHaveBeenCalled());
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    jest
      .mocked(getPermissionsAsync)
      .mockResolvedValue({ granted: true, canAskAgain: true } as never);
  });

  it("posts the failure when saving rejects outright", async () => {
    jest
      .mocked(getPermissionsAsync)
      .mockResolvedValue({ granted: true, canAskAgain: true } as never);
    jest.mocked(pickDownloadFolder).mockResolvedValue(new Directory());
    jest
      .mocked(saveTracks)
      .mockRejectedValue(new Error("The folder is no longer available"));
    Object.assign(AppState, { currentState: "background" });
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await waitFor(() => expect(saveTracks).toHaveBeenCalledTimes(1));

    await waitFor(() =>
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "Download failed",
            body: "No songs could be saved.",
          }),
        }),
      ),
    );
  });
});
