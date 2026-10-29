import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";

/** Let the destination paint its header before mounting secondary content. */
export function DeferredDetails({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return ready ? children : <View style={{ height: 240 }} />;
}
