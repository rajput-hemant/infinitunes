import type {
  AudioLockScreenOptions,
  AudioMetadata,
  AudioMode,
  AudioSource,
  AudioStatus,
} from "expo-audio";
import { useSyncExternalStore } from "react";

/**
 * Jest's `expo-audio` (see `jest.config.js`): a scriptable stand-in for the
 * native player. Code under test drives it through the real API; tests read
 * what it was asked to do and script what the engine reports back
 * (`finishLoading`, `failLoading`, `finishTrack`).
 */

type StatusListener = (status: AudioStatus) => void;

const idleStatus: AudioStatus = {
  id: "fake",
  currentTime: 0,
  playbackState: "idle",
  timeControlStatus: "paused",
  reasonForWaitingToPlay: "",
  mute: false,
  duration: 0,
  playing: false,
  loop: false,
  didJustFinish: false,
  isBuffering: false,
  isLoaded: false,
  playbackRate: 1,
  shouldCorrectPitch: true,
  isLive: false,
  currentOffsetFromLive: null,
  error: null,
};

function sourceUri(source: AudioSource | string | number | null): string {
  if (typeof source === "string") return source;
  if (source && typeof source === "object" && "uri" in source) {
    return source.uri ?? "";
  }
  return "";
}

export class FakeAudioPlayer {
  /** Every source `replace` loaded, oldest first. */
  readonly loads: string[] = [];
  lockScreen: { active: boolean; metadata?: AudioMetadata } = {
    active: false,
  };
  currentStatus: AudioStatus = idleStatus;
  private readonly listeners = new Set<StatusListener>();

  get playing() {
    return this.currentStatus.playing;
  }

  get currentTime() {
    return this.currentStatus.currentTime;
  }

  get duration() {
    return this.currentStatus.duration;
  }

  get loop() {
    return this.currentStatus.loop;
  }

  set loop(loop: boolean) {
    this.update({ loop });
  }

  replace(source: AudioSource | string | number | null) {
    this.loads.push(sourceUri(source));
    this.update({
      isLoaded: false,
      currentTime: 0,
      duration: 0,
      didJustFinish: false,
      error: null,
    });
  }

  play() {
    this.update({ playing: true, didJustFinish: false });
  }

  pause() {
    this.update({ playing: false });
  }

  seekTo(seconds: number) {
    this.update({ currentTime: seconds, didJustFinish: false });
    return Promise.resolve();
  }

  setActiveForLockScreen(
    active: boolean,
    metadata?: AudioMetadata,
    _options?: AudioLockScreenOptions,
  ) {
    this.lockScreen = { active, metadata };
  }

  updateLockScreenMetadata(metadata: AudioMetadata) {
    this.lockScreen = { ...this.lockScreen, metadata };
  }

  clearLockScreenControls() {
    this.lockScreen = { active: false };
  }

  addListener(_event: "playbackStatusUpdate", listener: StatusListener) {
    this.listeners.add(listener);
    return { remove: () => void this.listeners.delete(listener) };
  }

  /** Forgets what earlier tests did (the app keeps one player for its lifetime). */
  reset() {
    this.loads.length = 0;
    this.lockScreen = { active: false };
    this.currentStatus = idleStatus;
  }

  /** The engine finished loading the current source. */
  finishLoading(duration = 180) {
    this.update({ isLoaded: true, duration });
  }

  /** The engine could not load the current source. */
  failLoading(error = "Failed to load") {
    this.update({ error, playing: false });
  }

  /** The current source played to its end. */
  finishTrack() {
    this.update({
      didJustFinish: true,
      playing: false,
      currentTime: this.duration,
    });
  }

  private update(patch: Partial<AudioStatus>) {
    this.currentStatus = { ...this.currentStatus, ...patch };
    for (const listener of this.listeners) listener(this.currentStatus);
  }
}

const players: FakeAudioPlayer[] = [];

/** The player the code under test created last. */
export function lastPlayer(): FakeAudioPlayer {
  const player = players.at(-1);
  if (!player) throw new Error("No audio player was created");
  return player;
}

export function createAudioPlayer(): FakeAudioPlayer {
  const player = new FakeAudioPlayer();
  players.push(player);
  return player;
}

export function useAudioPlayerStatus(player: FakeAudioPlayer): AudioStatus {
  return useSyncExternalStore(
    (onChange) => player.addListener("playbackStatusUpdate", onChange).remove,
    () => player.currentStatus,
  );
}

/** Every audio mode the code under test set, oldest first. */
export const audioModes: Partial<AudioMode>[] = [];

export async function setAudioModeAsync(mode: Partial<AudioMode>) {
  audioModes.push(mode);
}

export async function requestNotificationPermissionsAsync() {
  return { granted: true };
}
