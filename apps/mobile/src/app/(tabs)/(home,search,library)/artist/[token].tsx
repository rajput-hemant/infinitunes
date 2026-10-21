import { EmptyState } from "~/components/empty-state";

/** Route reserved for the artist screen; its screen agent replaces this body. */
export default function ArtistScreen() {
  return (
    <EmptyState
      icon={{ ios: "music.microphone", android: "artist" }}
      title="Artist"
      message="This screen is coming soon."
    />
  );
}
