import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, render, waitFor } from "@testing-library/react-native";

import { forgetUserData } from "~/features/settings/end-session";
import { failureStore } from "~/lib/failure";
import { preferencesStore } from "~/lib/preferences";
import { queryClient } from "~/lib/query-client";
import {
  cacheQualifiedListen,
  clearSongCache,
  songCacheStore,
} from "~/lib/song-cache";
import { audioModes, lastPlayer } from "~/test/expo-audio";
import { resetFiles } from "~/test/expo-file-system";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";

import { playEntity } from "./play-entity";
import { PlaybackController } from "./playback-controller";
import { playbackStatusStore } from "./playback-status";
import { playerStore } from "./player-store";
import { seekTo, togglePlayback } from "./transport";

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
  queryClient.clear();
  preferencesStore.setState({ streamQuality: "excellent" });
  signInAs("listener-1");
  procedure("radio.songs").mockResolvedValue([]);
  procedure("song.syncedLyrics").mockResolvedValue({
    synced: null,
    plain: null,
    instrumental: false,
    source: "lrclib",
    copyright: null,
  });
  playerStore.setState(initial, true);
  lastPlayer().reset();
});

afterEach(() => queryClient.clear());

describe("PlaybackController", () => {
  it("rejects an earlier load of the same URL and events preceding a source clear", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    const oldError = player.queueStatus({ error: "First load failed" });
    await act(async () => playerStore.getState().skipToNext());
    await act(async () => playerStore.getState().skipToPrevious());
    const loads = [...player.loads];
    await act(async () => oldError());
    expect(player.loads).toEqual(loads);

    const oldFinish = player.queueStatus({ didJustFinish: true });
    await act(async () =>
      playerStore
        .getState()
        .playTracks([{ ...rows[1]!, download_url: "" }, rows[0]!]),
    );
    await act(async () => oldFinish());
    expect(playerStore.getState().currentIndex).toBe(0);
    expect(player.loads.at(-1)).toBe("");
    expect(player.playing).toBe(false);
  });

  it("applies a queued remote Next once to the current queue", async () => {
    const player = await mountController();
    await act(async () =>
      playerStore.getState().playTracks([...rows, ...rows]),
    );
    const next = player.queueRemote("nextTrack");
    const oldFinish = player.queueStatus({ didJustFinish: true });
    await act(async () => playerStore.getState().skipToNext());
    const loads = player.loads.length;
    await act(async () => next());
    expect(playerStore.getState().currentIndex).toBe(2);
    expect(player.loads).toHaveLength(loads + 1);
    await act(async () => oldFinish());
    expect(playerStore.getState().currentIndex).toBe(2);
    expect(player.loads).toHaveLength(loads + 1);
  });

  it("does not double-skip when Next and an old finish arrive before replacement", async () => {
    const player = await mountController();
    await act(async () =>
      playerStore.getState().playTracks([...rows, ...rows]),
    );
    const oldFinish = player.queueStatus({ didJustFinish: true });
    await act(async () => {
      player.pressRemote("nextTrack");
      oldFinish();
    });
    expect(playerStore.getState().currentIndex).toBe(1);
    expect(player.loads.at(-1)).toBe(ladder("Xy12AbCd", 320));
  });

  it("stops offline playback after two failed tracks despite a late loaded event", async () => {
    const player = await mountController();
    await act(async () =>
      playerStore.getState().playTracks([...rows, rows[0]!]),
    );
    await act(async () => player.finishLoading());
    const oldLoaded = player.queueStatus({ isLoaded: true });
    for (let rung = 0; rung < 5; rung += 1) {
      await act(async () => player.failLoading("Offline"));
    }
    expect(playerStore.getState().currentIndex).toBe(1);
    await act(async () => oldLoaded());
    for (let rung = 0; rung < 5; rung += 1) {
      await act(async () => player.failLoading("Offline"));
    }
    expect(playerStore.getState().currentIndex).toBe(1);
    expect(player.playing).toBe(false);
    expect(failureStore.getState().current?.message).toBe(
      "Can't reach the music server. Check your connection and try again.",
    );
  });

  it.each(["finish", "error", "loaded"] as const)(
    "ignores a delayed %s event from the replaced source",
    async (event) => {
      const player = await mountController();
      await act(async () =>
        playerStore.getState().playTracks([...rows, rows[0]!]),
      );
      await act(async () => player.finishLoading());
      const deliver = player.queueStatus(
        event === "finish"
          ? { didJustFinish: true }
          : event === "error"
            ? { error: "Previous source failed" }
            : { isLoaded: true, duration: 999, bufferedTime: 999 },
      );

      await act(async () => playerStore.getState().skipToNext());
      const loads = [...player.loads];
      await act(async () => deliver());

      expect(playerStore.getState().currentIndex).toBe(1);
      expect(player.loads).toEqual(loads);
      expect(player.playing).toBe(true);
      expect(playbackStatusStore.getState().duration).toBe(0);
      expect(playbackStatusStore.getState().bufferedTime).toBe(0);
      // An old loaded/error event must not consume the new source's first failure.
      await act(async () => player.failLoading());
      expect(player.loads.at(-1)).toBe(ladder("Xy12AbCd", 160));
    },
  );

  it("loads the entry again when Play follows an unreachable stop", async () => {
    const player = await mountController();
    await act(async () =>
      playerStore.getState().playTracks([...rows, rows[0]!]),
    );
    await act(async () => player.finishLoading());
    for (let rung = 0; rung < 10; rung += 1) {
      await act(async () => player.failLoading("Offline"));
    }
    expect(player.playing).toBe(false);
    const loads = player.loads.length;

    expect(player.lockScreen).toEqual({ active: false });
    await act(async () => togglePlayback());

    expect(player.loads).toHaveLength(loads + 1);
    expect(player.loads.at(-1)).toBe(ladder("Xy12AbCd", 320));
    expect(player.lockScreen.active).toBe(true);
    expect(player.playing).toBe(true);
    expect(playbackStatusStore.getState().duration).toBe(0);
  });

  it("loads a lone failed entry again when Play is pressed", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows.slice(0, 1)));
    for (let rung = 0; rung < 5; rung += 1) {
      await act(async () => player.failLoading("Bad file"));
    }
    const loads = player.loads.length;

    await act(async () => togglePlayback());

    expect(player.loads).toHaveLength(loads + 1);
    expect(player.loads.at(-1)).toBe(ladder("BSaNI3Yr", 320));
  });

  it("does not record the next entry when it never loads after the previous one did", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    await act(async () => player.finishLoading());
    expect(procedure("history.record")).toHaveBeenCalledTimes(1);

    await act(async () => playerStore.getState().skipToNext());
    for (let rung = 0; rung < 5; rung += 1) {
      await act(async () => player.failLoading("404"));
    }

    expect(procedure("history.record")).toHaveBeenCalledTimes(1);
  });

  it("does not move on one track per Play press while offline", async () => {
    const player = await mountController();
    await act(async () =>
      playerStore.getState().playTracks([...rows, rows[0]!]),
    );
    await act(async () => player.finishLoading());
    for (let rung = 0; rung < 10; rung += 1) {
      await act(async () => player.failLoading("Offline"));
    }
    const index = playerStore.getState().currentIndex;

    for (let press = 0; press < 3; press += 1) {
      await act(async () => togglePlayback());
      for (let rung = 0; rung < 5; rung += 1) {
        await act(async () => player.failLoading("Offline"));
      }
    }

    expect(playerStore.getState().currentIndex).toBe(index);
  });

  it("records a listen only once the entry has loaded", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    expect(procedure("history.record")).not.toHaveBeenCalled();

    await act(async () => player.finishLoading());

    expect(procedure("history.record")).toHaveBeenCalledTimes(1);
  });

  it("leaves the lock screen cleared when a skip lands on a linkless entry", async () => {
    const player = await mountController();
    await act(async () =>
      playerStore
        .getState()
        .playTracks([rows[0]!, { ...rows[1]!, download_url: "" }]),
    );
    await act(async () => player.finishLoading());
    expect(player.lockScreen.active).toBe(true);

    await act(async () => playerStore.getState().skipToNext());

    expect(player.lockScreen).toEqual({ active: false });
  });

  it("stops the previous source and reports a linkless entry", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    await act(async () => player.finishLoading());
    await act(async () =>
      playerStore.getState().playTracks([{ ...rows[1]!, download_url: "" }]),
    );

    expect(player.playing).toBe(false);
    expect(failureStore.getState().current?.message).toBe(
      "This song can't be played right now.",
    );
    expect(player.loads.at(-1)).toBe("");
  });

  it("resumes the paused entry when its current queue row is pressed", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    await act(async () => player.finishLoading());
    await act(async () => player.pause());

    await act(async () => playerStore.getState().playAt(0));

    expect(player.playing).toBe(true);
    expect(player.loads).toHaveLength(1);
  });

  it.each([
    "none",
    "pause",
    "seek",
    "play",
    "request",
    "queue",
    "playNext",
    "shuffle",
    "repeat",
    "quality",
  ] as const)(
    "advances a radio tail after a delayed refill unless the user played something else (%s)",
    async (action) => {
      const refill = Promise.withResolvers<typeof songs>();
      procedure("radio.songs").mockReturnValueOnce(refill.promise);
      const player = await mountController();
      await act(async () =>
        playerStore.getState().playTracks(rows.slice(0, 1), {
          radio: { stationId: "late", name: "Late", type: "featured" },
        }),
      );
      await act(async () => player.finishLoading());
      await act(async () => player.finishTrack());

      await act(async () => {
        if (action === "pause") {
          togglePlayback();
          togglePlayback();
        }
        if (action === "seek") seekTo(30);
        if (action === "play") playerStore.getState().playAt(0);
        if (action === "queue") playerStore.getState().addToQueue(rows[1]!);
        if (action === "playNext") playerStore.getState().playNext(rows[1]!);
        if (action === "shuffle") playerStore.getState().toggleShuffle();
        if (action === "repeat") playerStore.getState().cycleRepeat();
        if (action === "quality")
          preferencesStore.setState({ streamQuality: "high" });
        if (action === "request") {
          procedure("album.details").mockReturnValueOnce(new Promise(() => {}));
          void playEntity("album", "https://www.jiosaavn.com/album/x/token");
        }
      });
      await act(async () => refill.resolve(songs.slice(1)));

      expect(playerStore.getState().currentIndex).toBe(
        ["none", "queue", "playNext", "shuffle"].includes(action) ? 1 : 0,
      );
      if (action === "none") {
        expect(player.loads.at(-1)).toBe(ladder("Xy12AbCd", 320));
        expect(player.playing).toBe(true);
      }
    },
  );

  it("prefetches the lyrics of the playing song and the next one", async () => {
    procedure("song.syncedLyrics").mockResolvedValue({
      synced: null,
      plain: null,
      instrumental: false,
      source: "lrclib",
      copyright: null,
    });
    await mountController();
    await act(async () => playerStore.getState().playTracks(rows));

    await waitFor(() => {
      expect(procedure("song.syncedLyrics")).toHaveBeenCalledWith({
        id: songs[0].id,
      });
      expect(procedure("song.syncedLyrics")).toHaveBeenCalledWith({
        id: songs[1].id,
      });
    });
  });

  it("mirrors buffering progress while paused and clears it for a new source", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    await act(async () => {
      player.finishLoading(200);
      player.pause();
      player.bufferTo(120);
    });
    expect(playbackStatusStore.getState()).toMatchObject({
      playing: false,
      bufferedTime: 120,
    });

    await act(async () => playerStore.getState().skipToNext());
    expect(playbackStatusStore.getState().bufferedTime).toBe(0);
  });

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
    await act(async () => player.finishLoading());

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

  it("activates the lock screen once and only updates the metadata per track", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));

    await act(async () => playerStore.getState().skipToNext());

    // Re-activating rebuilds the Android media session and its notification.
    expect(player.lockScreenActivations).toBe(1);
    expect(player.lockScreen).toEqual({
      active: true,
      metadata: expect.objectContaining({ title: rows[1]?.name }),
    });
  });

  it("shows the next queue after the lock screen was cleared", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows.slice(0, 1)));
    await act(async () => playerStore.getState().removeAt(0));
    expect(player.lockScreen).toEqual({ active: false });

    await act(async () => playerStore.getState().playTracks(rows.slice(1)));

    expect(player.lockScreenActivations).toBe(2);
    expect(player.lockScreen.active).toBe(true);
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
  });

  it("skips an entry whose every bitrate fails", async () => {
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
  });

  it("stops and clears the lock screen when the queue is emptied", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows.slice(0, 1)));
    expect(player.playing).toBe(true);

    await act(async () => playerStore.getState().removeAt(0));

    expect(player.playing).toBe(false);
    expect(player.lockScreen).toEqual({ active: false });
  });

  it("stops and clears the lock screen on sign-out, and a later add to queue stays paused", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows.slice(0, 1)));
    expect(player.playing).toBe(true);

    await act(async () => forgetUserData());

    expect(player.playing).toBe(false);
    expect(player.lockScreen).toEqual({ active: false });
    await act(async () => playerStore.getState().addToQueue(rows[1]!));
    expect(playerStore.getState().started).toBe(false);
    expect(player.playing).toBe(false);
    expect(player.loads).toHaveLength(1);
  });

  it("moves to the next entry when a track ends", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    await act(async () => player.finishLoading());

    await act(async () => player.finishTrack());
    await act(async () => player.finishLoading());

    expect(player.loads.at(-1)).toBe(ladder("Xy12AbCd", 320));
    expect(procedure("history.record")).toHaveBeenLastCalledWith({
      id: "Xy12AbCd",
      type: "song",
    });
  });

  it("shows next/previous on the lock screen and follows the remote buttons", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    await act(async () => player.finishLoading());
    expect(player.lockScreenOptions).toMatchObject({
      showNextTrack: true,
      showPreviousTrack: true,
    });

    await act(async () => player.pressRemote("nextTrack"));
    expect(player.loads.at(-1)).toBe(ladder("Xy12AbCd", 320));

    await act(async () => player.pressRemote("previousTrack"));
    expect(player.loads.at(-1)).toBe(ladder("BSaNI3Yr", 320));
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

  it("keeps the playing entry loaded while Up next is reordered or cleared", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    await act(async () => player.finishLoading());

    // Moving the next entry above the playing one shifts its index only.
    await act(async () => playerStore.getState().moveInQueue(1, 0));
    expect(playerStore.getState().currentIndex).toBe(1);
    await act(async () => playerStore.getState().clearUpNext());

    expect(player.loads).toEqual([ladder("BSaNI3Yr", 320)]);
    expect(player.playing).toBe(true);
    expect(procedure("history.record")).toHaveBeenCalledTimes(1);
  });

  it("starts a looping one-entry queue over when it ends", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows.slice(0, 1)));
    await act(async () => player.finishLoading());
    playerStore.setState({ repeat: "playlist" });

    // The engine's last position can stop short of the reported duration.
    await act(async () => player.finishTrack(179.9));

    expect(player.currentTime).toBe(0);
    expect(player.playing).toBe(true);
  });

  it("clears the source for an entry without a stream link", async () => {
    const silent = toSongRow(
      rawSong({
        id: "NoLink01",
        download_url: undefined,
        more_info: { ...rawSong().more_info, download_url: undefined },
      }),
    );
    const player = await mountController();

    await act(async () => playerStore.getState().playTracks([silent]));

    expect(player.loads).toEqual([""]);
  });
});

describe("PlaybackController song cache", () => {
  beforeEach(async () => {
    await clearSongCache();
    resetFiles();
    preferencesStore.setState({
      cacheFrequentSongs: true,
      streamQuality: "excellent",
    });
    const entry = { ...rows[0]!, queueItemId: "qualify" };
    await cacheQualifiedListen(entry, "excellent");
    await cacheQualifiedListen(entry, "excellent");
  });

  it("loads the cached file, evicts a corrupt file and retries streaming before stepping down", async () => {
    const player = await mountController();
    await act(async () => playerStore.getState().playTracks(rows));
    expect(player.loads[0]).toMatch(/^file:\/\/\/cache\/frequent-songs\//);
    await act(async () => player.failLoading());
    expect(player.loads.at(-1)).toBe(ladder("BSaNI3Yr", 320));
    expect(songCacheStore.getState().songs.BSaNI3Yr).toBeUndefined();
    await act(async () => player.failLoading());
    expect(player.loads.at(-1)).toBe(ladder("BSaNI3Yr", 160));
  });
});
