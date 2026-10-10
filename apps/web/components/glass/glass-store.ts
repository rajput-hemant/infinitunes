/**
 * The artwork behind the ambient field. The player publishes the current
 * track's artwork URL (`useGlassArtwork`); the ambient layer renders it and
 * the sampler derives the adaptive tint from it.
 */
let artwork: string | null = null;
const listeners = new Set<() => void>();

export const subscribeGlassArtwork = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getGlassArtwork = () => artwork;

export function setGlassArtwork(url: string | null) {
  if (url === artwork) return;
  artwork = url;
  listeners.forEach((listener) => listener());
}
