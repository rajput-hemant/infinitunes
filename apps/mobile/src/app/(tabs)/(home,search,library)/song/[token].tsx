import { EmptyState } from "~/components/empty-state";

/** Route reserved for the song screen; its screen agent replaces this body. */
export default function SongScreen() {
  return (
    <EmptyState
      icon={{ ios: "music.note", android: "music_note" }}
      title="Song"
      message="This screen is coming soon."
    />
  );
}
