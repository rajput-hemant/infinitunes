import { useParams } from "next/navigation";
import React from "react";

const getHash = () => {
  try {
    return decodeURIComponent(window.location.hash.replace("#", ""));
  } catch {
    return null;
  }
};

const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

/**
 * @see https://github.com/vercel/next.js/discussions/49465#discussioncomment-7034208
 */

export function useHash() {
  // Next's client navigations do not fire `hashchange`; reading `useParams`
  // re-renders on route changes so the snapshot below is re-read.
  useParams();

  return React.useSyncExternalStore(subscribe, getHash, () => null);
}
