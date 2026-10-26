import {
  router,
  useLocalSearchParams,
  useNavigation,
  useRoute,
} from "expo-router";
import { useEffect, useRef } from "react";
import { View } from "react-native";

import { Spinner } from "~/components/ui/spinner";
import { authClient } from "~/lib/auth-client";
import { single } from "~/lib/params";

import { isAppAction, runAppAction, type ActionOutcome } from "./app-actions";

type Params = { action?: string; id?: string; q?: string };

type StackState = {
  key: string;
  routes: readonly { key: string; name: string }[];
};

/** A stack action aimed at this screen's own place in its stack. */
type LandingAction = {
  type: "POP_TO" | "POP";
  payload: { name: string } | { count: number };
  source: string;
  target: string;
};

/**
 * What the action screen `key` does with `outcome` in its stack `state`:
 * a stack action, `"home"` when there is nothing to go back to (a cold
 * start), or `null` when the screen has already left the stack (a later
 * link landed first and took it along).
 *
 * - `player`: `POP_TO` the player from this screen. The stack router looks
 *   down from the source for one: found (the queue sheet or another link
 *   over the open player), it drops everything above it, this screen
 *   included; not found, this screen and anything above it make way for
 *   one. So a link never stacks a second player (Expo Router's `singular`
 *   does not dedupe a replace). The router decides when it reduces the
 *   action, not from `state` here, which is stale while an earlier
 *   landing's action waits in the queue for the commit.
 * - `back`: this screen leaves, wherever it is; what is above it stays.
 *
 * Both name this screen as the `source` (and its stack as the `target`), so
 * the router works from its position, not from the top of the stack.
 */
export function landing(
  state: StackState,
  key: string,
  outcome: ActionOutcome,
): LandingAction | "home" | null {
  if (outcome === "home") return "home";
  const index = state.routes.findIndex((route) => route.key === key);
  if (index === -1) return null;
  const aimed = { source: key, target: state.key };
  if (outcome === "player") {
    return { type: "POP_TO", payload: { name: "player" }, ...aimed };
  }
  return index > 0 ? { type: "POP", payload: { count: 1 }, ...aimed } : "home";
}

/**
 * `infinitunes://action/<name>`: runs the action once the stored session has
 * loaded (a cold start from Siri reads it first), then leaves for the player
 * (back to it when it is already open underneath), or back where the listener
 * was (Home on a cold start). An unknown action just leaves.
 */
export function AppActionScreen() {
  const params = useLocalSearchParams<Params>();
  const action = single(params.action);
  const id = single(params.id);
  const q = single(params.q);
  const { data, isPending } = authClient.useSession();
  const userId = data?.user.id;
  // This screen's own navigator and place in it: the imperative router cannot
  // answer `canGoBack` before the first render of a cold start has finished,
  // and the top of the stack need not be this screen (a second link queued).
  const navigation = useNavigation();
  const { key } = useRoute();
  // One run per visit, whatever re-renders the session or params cause.
  const ran = useRef(false);

  useEffect(() => {
    if (isPending || ran.current) return;
    ran.current = true;
    const land = (outcome: ActionOutcome) => {
      const state = navigation.getState();
      const next = state ? landing(state, key, outcome) : "home";
      if (next === "home") router.replace("/");
      else if (next) navigation.dispatch(next);
    };
    const outcome = isAppAction(action)
      ? runAppAction(action, { userId, id, q })
      : Promise.resolve<ActionOutcome>("back");
    // Never in this effect itself: on a cold start the router binds in its
    // root's effect, which runs after this screen's.
    void outcome.then(land);
  }, [isPending, action, userId, id, q, navigation, key]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Spinner accessibilityLabel="Loading" />
    </View>
  );
}
