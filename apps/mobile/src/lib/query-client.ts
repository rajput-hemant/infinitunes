import {
  focusManager,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { addNetworkStateListener } from "expo-network";
import { AppState } from "react-native";

// React Native has no window focus or `online` events: report foregrounding
// and connectivity so queries refetch on return and pause while offline.
focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener("change", (state) =>
    setFocused(state === "active"),
  );
  return () => subscription.remove();
});

onlineManager.setEventListener((setOnline) => {
  const subscription = addNetworkStateListener((state) =>
    setOnline(state.isConnected !== false),
  );
  return () => subscription.remove();
});

/** The app's single query cache, shared by hooks and the tRPC options proxy. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Catalog data changes slowly; the web caches it for 10 to 60 minutes.
      staleTime: 5 * 60 * 1000,
    },
  },
});
