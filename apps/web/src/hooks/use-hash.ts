import React from "react";
import { useParams } from "next/navigation";

const getHash = () =>
  typeof window !== "undefined" ?
    decodeURIComponent(window.location.hash.replace("#", ""))
  : null;

/**
 * @see https://github.com/vercel/next.js/discussions/49465#discussioncomment-7034208
 */

export function useHash() {
  const [isClient, setIsClient] = React.useState(false);
  const [hash, setHash] = React.useState(getHash());

  const params = useParams();

  React.useEffect(() => {
    setIsClient(true);
    setHash(getHash());
  }, [params]);

  return isClient ? hash : null;
}
