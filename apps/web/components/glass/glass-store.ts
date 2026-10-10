/**
 * The artwork behind the ambient field, two independent slots. The player
 * publishes the current track's artwork URL (`useGlassArtwork`); the ambient
 * layer renders it and the sampler derives the adaptive tint from it. A detail
 * page publishes its own artwork (`useGlassPageArtwork`) as a wash that fades
 * out down the viewport; both show at once, like the mockup's `#ambient` and
 * `.bgart`.
 */
let artwork: string | null = null;
let pageArtwork: string | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const subscribeGlassArtwork = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getGlassArtwork = () => artwork;
export const getGlassPageArtwork = () => pageArtwork;

export function setGlassArtwork(url: string | null) {
  if (url === artwork) return;
  artwork = url;
  emit();
}

export function setGlassPageArtwork(url: string | null) {
  if (url === pageArtwork) return;
  pageArtwork = url;
  emit();
}
