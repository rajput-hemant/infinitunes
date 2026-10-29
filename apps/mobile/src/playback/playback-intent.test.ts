import { playbackStatusStore, requestPlaying } from "./playback-status";

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  requestPlaying(null);
  jest.useRealTimers();
});

it("falls back to native status if the engine never acknowledges the press", () => {
  playbackStatusStore.setState({ playing: false });
  requestPlaying(true);
  expect(playbackStatusStore.getState().playingIntent).toBe(true);
  expect(playbackStatusStore.getState().playing).toBe(false);
  jest.advanceTimersByTime(1500);
  expect(playbackStatusStore.getState().playingIntent).toBeNull();
});

it("keeps a second press independent of the first press timeout", () => {
  requestPlaying(true);
  jest.advanceTimersByTime(1000);
  requestPlaying(false);
  jest.advanceTimersByTime(500);
  expect(playbackStatusStore.getState().playingIntent).toBe(false);
  jest.advanceTimersByTime(1000);
  expect(playbackStatusStore.getState().playingIntent).toBeNull();
});
