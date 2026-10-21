import { EmptyState } from "~/components/empty-state";

/** Route reserved for the episode screen; its screen agent replaces this body. */
export default function EpisodeScreen() {
  return (
    <EmptyState
      icon={{ ios: "waveform", android: "podcasts" }}
      title="Episode"
      message="This screen is coming soon."
    />
  );
}
