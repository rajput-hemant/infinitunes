import * as QuickActions from "expo-quick-actions";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * iOS home-screen quick actions (`plugins/ios-quick-actions.ts`): open the
 * item's `params.href`. `expo-quick-actions/router` does this too, but imports
 * `expo-router/build/hooks`, which Bun's isolated install does not resolve
 * from that package. Mount it in a sub-layout (it navigates on cold start).
 */
export function useQuickActionRouting() {
  const router = useRouter();
  useEffect(() => {
    const open = (action: QuickActions.Action) => {
      const href = action.params?.href;
      // Next tick: the navigator is not ready on a cold launch's first effect.
      if (typeof href === "string")
        setTimeout(() => router.navigate(href as never));
    };
    if (QuickActions.initial) open(QuickActions.initial);
    const sub = QuickActions.addListener(open);
    return () => sub.remove();
  }, [router]);
}
