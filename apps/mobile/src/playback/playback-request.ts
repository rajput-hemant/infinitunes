let generation = 0;

/** Captures playback intent so automatic work can yield to a later user action. */
export function capturePlaybackRequest() {
  const request = generation;
  return () => request === generation;
}

/** Every new play or transport action supersedes pending playback work. */
export function beginPlaybackRequest() {
  generation += 1;
  return capturePlaybackRequest();
}
