import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, render } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { audioModes, lastPlayer } from "~/test/expo-audio";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";

import { PlaybackController } from "./playback-controller";
import { playerStore } from "./player-store";

const songs = ["BSaNI3Yr", "Xy12AbCd"].map((id) => rawSong({ id }));
const rows = songs.map(toSongRow);
const ladder = (id: string, rate: number) =>
  `https://aac.saavncdn.com/598/${id}_${rate}.mp4`;

const initial = playerStore.getState();

async function mountController() {
  await render(<PlaybackController />);
  return lastPlayer();
}

beforeEach(() => {
  signInAs("listener-1");
  procedure("radio.songs").mockResolvedValue([]);
  playerStore.setState(initial, true);
  lastPlayer().reset();
});

describe("PlaybackController", () => {
  it("sets up a background, lock-screen capable audio session", async () => {
    await mountController();

    expect(audioModes.at(-1)).toEqual({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  });

  it("waits for the first play before loading a restored queue", async () => {
    playerStore.setState({
      queue: rows.map((row) => ({ ...row, queueItemId: row.id })),
    });
    const player = await mountController();

    expect(player.loads).toEqual([]);
  });

  it("loads the best bitrate, records the listen and fills the lock screen", async () => {
    const player = await mountController();

    await act(async () => playerStore.getState().playTracks(rows));

    expect(player.loads).toEqual([ladder("BSaNI3Yr", 320)]);
    expect(player.playing).toBe(true);
    expect(procedure("history.record")).toHaveBeenCalledWith({
      id: "BSaNI3Yr",
      type: "song",
    });
    expect(player.lockScreen).toEqual({
      active: true,
      metadata: {
        title: "FA9LA & Friends",
        artist: "Flipperachi - FA9LA",
        artworkUrl: expect.stringContaining("-500x500.jpg"),
      },
    });
  });

  it("starts below 320 kbps for a song without that encode", async () => {
    const capped = toSongRow(
      rawSong({
        id: "Capped01",
        more_info: { ...rawSong().more_info, "320kbps": "false" },
      }),
    );
    const player = await mountController();

    await act(async () => playerStore.getState().playTracks([capped]));

    expect(player.loads).toEqual([ladder("Capped01", 160)]);
  });

  it("steps down a bitrate each time the engine fails to load", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));

    await act(async () => player.failLoading());
    await act(async () => player.failLoading());

    expect(player.loads).toEqual([
      ladder("BSaNI3Yr", 320),
      ladder("BSaNI3Yr", 160),
      ladder("BSaNI3Yr", 96),
    ]);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("skips an entry whose every bitrate fails, with one toast", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));

    // Every rung fails with the same message, as a dead CDN path does.
    const rates = [320, 160, 96, 48, 12];
    for (let failed = 0; failed < rates.length; failed += 1) {
      await act(async () => player.failLoading("Source error"));
    }

    expect(player.loads).toEqual([
      ...rates.map((rate) => ladder("BSaNI3Yr", rate)),
      ladder("Xy12AbCd", 320),
    ]);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Couldn't play this song");
  });

  it("stops and clears the lock screen when the queue is emptied", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows.slice(0, 1)));
    expect(player.playing).toBe(true);

    await act(async () => playerStore.getState().removeAt(0));

    expect(player.playing).toBe(false);
    expect(player.lockScreen).toEqual({ active: false });
  });

  it("moves to the next entry when a track ends", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    await act(async () => player.finishLoading());

    await act(async () => player.finishTrack());

    expect(player.loads.at(-1)).toBe(ladder("Xy12AbCd", 320));
    expect(procedure("history.record")).toHaveBeenLastCalledWith({
      id: "Xy12AbCd",
      type: "song",
    });
  });

  it("resumes the paused entry when its list is played again", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    await act(async () => player.finishLoading());
    await act(async () => player.pause());

    await act(async () => playerStore.getState().playTracks(rows));

    expect(player.loads).toEqual([ladder("BSaNI3Yr", 320)]);
    expect(player.playing).toBe(true);
  });

  it("starts a looping one-entry queue over when it ends", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows.slice(0, 1)));
    await act(async () => player.finishLoading());
    playerStore.setState({ repeat: "playlist" });

    await act(async () => player.finishTrack());

    expect(player.currentTime).toBe(0);
    expect(player.playing).toBe(true);
  });

  it("never loads an entry without a stream link, and says why", async () => {
    const silent = toSongRow(
      rawSong({
        id: "NoLink01",
        download_url: undefined,
        more_info: { ...rawSong().more_info, download_url: undefined },
      }),
    );
    const player = await mountController();

    await act(async () => playerStore.getState().playTracks([silent]));

    expect(player.loads).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith(
      "This song can't be played right now.",
    );
  });
});
