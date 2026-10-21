import { EmptyState } from "~/components/empty-state";

/** Route reserved for the album screen; its screen agent replaces this body. */
export default function AlbumScreen() {
  return (
    <EmptyState
      icon={{ ios: "square.stack", android: "album" }}
      title="Album"
      message="This screen is coming soon."
    />
  );
}
