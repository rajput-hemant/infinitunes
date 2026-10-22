import * as QuickActions from "expo-quick-actions";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

/** The launch action already opened (it stays `initial` for the whole process). */
let openedLaunchAction: QuickActions.Action | undefined;

/**
 * iOS home-screen quick actions (`plugins/ios-quick-actions.ts`): open the
 * item's `params.href`. `expo-quick-actions/router` does this too, but imports
 * `expo-router/build/hooks`, which Bun's isolated install does not resolve
 * from that package. Mount it in a sub-layout (it navigates on cold start).
 */
export function useQuickActionRouting() {
  const router = useRouter();
  // The effect must not re-run (and re-open the launch action) when the
  // router object changes.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  useEffect(() => {
    const open = (action: QuickActions.Action) => {
      const href = action.params?.href;
      // Next tick: the navigator is not ready on a cold launch's first effect.
      if (typeof href === "string") {
        setTimeout(() => routerRef.current.navigate(href as never));
      }
    };
    // The launch action never changes: open it once per process, not per mount.
    if (QuickActions.initial && QuickActions.initial !== openedLaunchAction) {
      openedLaunchAction = QuickActions.initial;
      open(QuickActions.initial);
    }
    const sub = QuickActions.addListener(open);
    return () => sub.remove();
  }, []);
}
