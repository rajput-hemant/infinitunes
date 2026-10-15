import { MORPH_CLASS } from "~/lib/view-transition";

/**
 * The card a visitor just opened. Its artwork holds the morph name from the
 * click until the page it opens takes it over, so the browser has a pair to
 * fly. The page has two things that can take it: the loading skeleton's
 * artwork placeholder (the route opens on it) and the real artwork (the
 * content, which is the first thing when the page was already cached). Both
 * are claimed inside the commit of a view transition, never by an observer
 * running after it. Module state: the halves are client islands in one bundle.
 */
type Offer = {
  name: string;
  source: HTMLElement;
  image: string | null;
  expires: number;
};
type Handoff = { name: string; expires: number };

const OFFER_MS = 10_000;
const HANDOFF_MS = 15_000;
let offer: Offer | null = null;
let handoff: Handoff | null = null;

function nameElement(el: HTMLElement, name: string) {
  el.style.viewTransitionName = name;
  el.style.viewTransitionClass = name ? MORPH_CLASS : "";
}

/** Names `source` and remembers it for the page that is about to open. */
export function offerMorph(name: string, source: HTMLElement) {
  dropMorph();
  nameElement(source, name);
  // The picture already on screen: the placeholder it flies into shows it too,
  // so the flight ends on the same artwork instead of fading to a grey box.
  const picture = source.querySelector("img");
  const image = picture?.currentSrc || picture?.getAttribute("src") || null;
  offer = { name, source, image, expires: Date.now() + OFFER_MS };
}

/** Forgets the offer and unnames its source (the click went nowhere). */
export function dropMorph() {
  if (offer) nameElement(offer.source, "");
  offer = null;
  handoff = null;
}

/**
 * Takes the offered name for artwork that is mounting. `expected` is the
 * artwork's own name when it knows it (the real artwork does, the skeleton does
 * not). The card is unnamed here, inside the update callback of the
 * transition: the browser captured the old state before it ran. What the
 * skeleton took stays claimable by the real artwork that replaces it.
 */
export function claimMorph(
  expected?: string,
): { name: string; image: string | null } | null {
  const now = Date.now();
  if (offer) {
    const { name, source, image, expires } = offer;
    if (now > expires || (expected !== undefined && expected !== name)) {
      return null;
    }
    offer = null;
    nameElement(source, "");
    handoff =
      expected === undefined ? { name, expires: now + HANDOFF_MS } : null;
    return { name, image };
  }
  if (handoff && now <= handoff.expires && handoff.name === expected) {
    handoff = null;
    return { name: expected, image: null };
  }
  return null;
}
