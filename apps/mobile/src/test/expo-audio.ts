import type {
  AudioLockScreenOptions,
  AudioMetadata,
  AudioMode,
  AudioSource,
  AudioStatus,
} from "expo-audio";
import { useEffect, useState } from "react";

/**
 * Jest's `expo-audio` (see `jest.config.js`): a scriptable stand-in for the
 * native player. Code under test drives it through the real API; tests read
 * what it was asked to do and script what the engine reports back
 * (`finishLoading`, `failLoading`, `finishTrack`).
 *
 * It models the worst case the native module allows, which the controller
 * has to cope with: `replace` emits nothing by itself (no status is
 * guaranteed before the next failure), and `error` is set only on
 * the one `playbackStatusUpdate` that reports it (every other status, and
 * `currentStatus`, says `null`), so a load error is an event, not a state.
 */

type StatusListener = (status: AudioStatus) => void;
type SourceStatus = AudioStatus & { sourceGeneration: number };
type RemoteCommand = "nextTrack" | "previousTrack";
type RemoteListener = (event: { command: RemoteCommand }) => void;
type Subscription = { remove: () => void };

const idleStatus: SourceStatus = {
  id: "fake",
  sourceGeneration: 0,
  currentTime: 0,
  bufferedTime: 0,
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
  /** The options the last `setActiveForLockScreen` call passed. */
  lockScreenOptions?: AudioLockScreenOptions;
  /** How often `setActiveForLockScreen(true)` ran (each one rebuilds the Android session). */
  lockScreenActivations = 0;
  currentStatus: SourceStatus = idleStatus;
  private readonly listeners = new Set<StatusListener>();
  private readonly remoteListeners = new Set<RemoteListener>();

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
    this.currentStatus = {
      ...this.currentStatus,
      sourceGeneration: this.currentStatus.sourceGeneration + 1,
      isLoaded: false,
      currentTime: 0,
      bufferedTime: 0,
      duration: 0,
      didJustFinish: false,
    };
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
    options?: AudioLockScreenOptions,
  ) {
    this.lockScreenOptions = options;
    if (active) this.lockScreenActivations += 1;
    this.lockScreen = { active, metadata };
  }

  updateLockScreenMetadata(metadata: AudioMetadata) {
    this.lockScreen = { ...this.lockScreen, metadata };
  }

  clearLockScreenControls() {
    this.lockScreen = { active: false };
  }

  addListener(
    event: "playbackStatusUpdate",
    listener: StatusListener,
  ): Subscription;
  addListener(event: "remoteCommand", listener: RemoteListener): Subscription;
  addListener(
    event: "playbackStatusUpdate" | "remoteCommand",
    listener: StatusListener | RemoteListener,
  ): Subscription {
    const set = (
      event === "remoteCommand" ? this.remoteListeners : this.listeners
    ) as Set<typeof listener>;
    set.add(listener);
    return { remove: () => void set.delete(listener) };
  }

  /** The lock screen, a headset or Bluetooth pressed next or previous. */
  pressRemote(command: RemoteCommand) {
    this.queueRemote(command)();
  }

  /** The engine reports a status change nothing in JS asked for (a media key, a headset). */
  emitStatus(patch: Partial<AudioStatus>) {
    this.update(patch);
  }

  /** The engine stopped and said nothing: only a read of `currentStatus` shows it. */
  stopSilently() {
    this.currentStatus = { ...this.currentStatus, playing: false };
  }

  /** A native event already emitted, waiting for delivery to JS. */
  queueStatus(patch: Partial<AudioStatus>) {
    const status = { ...this.currentStatus, ...patch };
    return () => this.emit(status);
  }

  queueRemote(command: RemoteCommand) {
    const event = { command };
    return () => {
      for (const listener of this.remoteListeners) listener(event);
    };
  }

  /** Forgets what earlier tests did (the app keeps one player for its lifetime). */
  reset() {
    this.loads.length = 0;
    this.lockScreen = { active: false };
    this.lockScreenActivations = 0;
    this.currentStatus = {
      ...idleStatus,
      sourceGeneration: this.currentStatus.sourceGeneration,
    };
  }

  /** Loading can advance while the player is paused. */
  bufferTo(bufferedTime: number) {
    this.update({ bufferedTime });
  }

  /** The engine finished loading the current source. */
  finishLoading(duration = 180) {
    this.update({ isLoaded: true, duration });
  }

  /**
   * The engine could not load the current source. Like Media3, the error
   * event is followed at once by the idle state change, which carries no
   * error; inside one `act` both land before React renders.
   */
  failLoading(error = "Failed to load") {
    this.currentStatus = { ...this.currentStatus, playing: false };
    this.emit({ ...this.currentStatus, error });
    this.update({ playbackState: "idle" });
  }

  /** The current source played to its end (at `at`, the duration by default). */
  finishTrack(at = this.duration) {
    this.update({
      didJustFinish: true,
      playing: false,
      currentTime: at,
    });
  }

  private update(patch: Partial<AudioStatus>) {
    this.currentStatus = { ...this.currentStatus, ...patch };
    this.emit(this.currentStatus);
  }

  private emit(status: AudioStatus) {
    for (const listener of this.listeners) listener(status);
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

/** expo-audio's hook (`useEvent`): the last status event, as React state. */
export function useAudioPlayerStatus(player: FakeAudioPlayer): AudioStatus {
  const [status, setStatus] = useState<AudioStatus>(player.currentStatus);
  useEffect(
    () => player.addListener("playbackStatusUpdate", setStatus).remove,
    [player],
  );
  return status;
}

/** Every audio mode the code under test set, oldest first. */
export const audioModes: Partial<AudioMode>[] = [];

export async function setAudioModeAsync(mode: Partial<AudioMode>) {
  audioModes.push(mode);
}

export async function requestNotificationPermissionsAsync() {
  return { granted: true };
}
