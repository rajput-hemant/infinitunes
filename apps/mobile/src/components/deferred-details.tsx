import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Platform, View } from "react-native";

/** Let the destination paint its header before mounting secondary content on iOS. */
export function DeferredDetails({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(Platform.OS !== "ios");
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return ready ? children : <View style={{ height: 240 }} />;
}
