import { EmptyState } from "~/components/empty-state";

/** Route reserved for the podcast screen; its screen agent replaces this body. */
export default function PodcastScreen() {
  return (
    <EmptyState
      icon={{ ios: "mic", android: "podcasts" }}
      title="Podcast"
      message="This screen is coming soon."
    />
  );
}
