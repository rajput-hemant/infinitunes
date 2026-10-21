import { EmptyState } from "~/components/empty-state";

/** Route reserved for the playlist screen; its screen agent replaces this body. */
export default function PlaylistScreen() {
  return (
    <EmptyState
      icon={{ ios: "music.note.list", android: "queue_music" }}
      title="Playlist"
      message="This screen is coming soon."
    />
  );
}
