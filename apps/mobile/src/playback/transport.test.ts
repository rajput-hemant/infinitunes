import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";

import { lastPlayer } from "~/test/expo-audio";

import { audioPlayer, markSourceEnded, replaceSource } from "./audio-engine";
import { playbackPosition } from "./playback-status";
import { playerStore } from "./player-store";
import { resumePlayback, seekTo, togglePlayback } from "./transport";

/** Jest's `expo-audio` is a scriptable stand-in; these record what it was asked to do. */
const play = jest.spyOn(audioPlayer, "play");
const pause = jest.spyOn(audioPlayer, "pause");
const seek = jest.spyOn(audioPlayer, "seekTo");

const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  audioPlayer.pause();
  void audioPlayer.seekTo(0);
  markSourceEnded(false);
  jest.clearAllMocks();
});

/** A restored queue the listener has not started this run. */
function restoreQueue() {
  playerStore.getState().playTracks([toSongRow(rawSong())]);
  playerStore.setState({ started: false });
}

describe("togglePlayback", () => {
  it("asks the controller to load again when nothing is loaded", () => {
    restoreQueue();
    playerStore.getState().start();
    replaceSource(null);
    const before = playerStore.getState().retryRequest;
    jest.clearAllMocks();

    togglePlayback();

    expect(playerStore.getState().retryRequest).toBe(before + 1);
    expect(play).not.toHaveBeenCalled();
  });

  it("starts the restored queue on the first press, without touching the engine", () => {
    restoreQueue();

    togglePlayback();

    expect(playerStore.getState().started).toBe(true);
    expect(play).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
  });

  it("does nothing on the first press when there is no queue", () => {
    togglePlayback();

    expect(playerStore.getState().started).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });

  it("pauses what is playing", () => {
    restoreQueue();
    playerStore.getState().start();
    audioPlayer.play();
    jest.clearAllMocks();

    togglePlayback();

    expect(pause).toHaveBeenCalledTimes(1);
    expect(audioPlayer.playing).toBe(false);
  });

  it("resumes a paused track where it stopped", () => {
    restoreQueue();
    playerStore.getState().start();
    replaceSource("https://example.test/a.mp4");
    void audioPlayer.seekTo(42);
    jest.clearAllMocks();

    togglePlayback();

    expect(play).toHaveBeenCalledTimes(1);
    expect(seek).not.toHaveBeenCalled();
    expect(audioPlayer.currentTime).toBe(42);
  });
});

describe("resumePlayback", () => {
  it("leaves a playing track alone", () => {
    audioPlayer.play();
    jest.clearAllMocks();

    resumePlayback();

    expect(play).not.toHaveBeenCalled();
    expect(seek).not.toHaveBeenCalled();
  });

  it("starts a track that played to its end over, once", () => {
    markSourceEnded(true);
    lastPlayer().finishLoading(180);
    lastPlayer().finishTrack(179);
    jest.clearAllMocks();

    resumePlayback();

    expect(seek).toHaveBeenCalledWith(0);
    expect(play).toHaveBeenCalledTimes(1);
    expect(audioPlayer.currentTime).toBe(0);

    // The ended flag was consumed: pausing and resuming again keeps the place.
    audioPlayer.pause();
    void audioPlayer.seekTo(30);
    jest.clearAllMocks();
    resumePlayback();
    expect(seek).not.toHaveBeenCalled();
    expect(audioPlayer.currentTime).toBe(30);
  });

  it("treats a position at the reported duration as ended", () => {
    lastPlayer().finishLoading(100);
    void audioPlayer.seekTo(100);
    jest.clearAllMocks();

    resumePlayback();

    expect(seek).toHaveBeenCalledWith(0);
  });
});

describe("seekTo", () => {
  it("resumes at an explicit seek position after completion", () => {
    lastPlayer().finishLoading(180);
    lastPlayer().finishTrack(179.9);
    markSourceEnded(true);

    seekTo(75);
    jest.clearAllMocks();
    resumePlayback();

    expect(seek).not.toHaveBeenCalled();
    expect(audioPlayer.currentTime).toBe(75);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("moves the engine and the playhead together", () => {
    seekTo(75);

    expect(seek).toHaveBeenCalledWith(75);
    expect(playbackPosition.get()).toBe(75);
  });
});
