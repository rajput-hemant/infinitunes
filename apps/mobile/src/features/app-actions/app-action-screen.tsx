import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { authClient } from "~/lib/auth-client";

import { isAppAction, runAppAction, type ActionOutcome } from "./app-actions";

type Params = { action?: string; id?: string; q?: string };

/** One value of a param Expo Router may hand over repeated. */
function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * `infinitunes://action/<name>`: runs the action once the stored session has
 * loaded (a cold start from Siri reads it first), then leaves for the player,
 * or back where the listener was (Home on a cold start). An unknown action
 * just leaves.
 */
export function AppActionScreen() {
  const params = useLocalSearchParams<Params>();
  const action = single(params.action);
  const id = single(params.id);
  const q = single(params.q);
  const { data, isPending } = authClient.useSession();
  const userId = data?.user.id;
  // This screen's own navigator: the imperative router cannot answer
  // `canGoBack` before the first render of a cold start has finished.
  const navigation = useNavigation();
  // One run per visit, whatever re-renders the session or params cause.
  const ran = useRef(false);

  useEffect(() => {
    if (isPending || ran.current) return;
    ran.current = true;
    const land = (outcome: ActionOutcome) => {
      if (outcome === "player") router.replace("/player");
      else if (navigation.canGoBack()) navigation.goBack();
      else router.replace("/");
    };
    const outcome = isAppAction(action)
      ? runAppAction(action, { userId, id, q })
      : Promise.resolve<ActionOutcome>("back");
    // Never in this effect itself: on a cold start the router binds in its
    // root's effect, which runs after this screen's.
    void outcome.then(land);
  }, [isPending, action, userId, id, q, navigation]);

  return (
    <View
      className="flex-1 items-center justify-center bg-background"
      accessibilityLabel="Loading"
    >
      <ActivityIndicator />
    </View>
  );
}
