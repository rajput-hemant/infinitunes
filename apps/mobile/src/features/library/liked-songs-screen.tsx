import type { SongRowItem } from "@infinitunes/types";
import { Stack } from "expo-router";

import { SongRow } from "~/components/song-row";
import { useFavoriteToggle } from "~/user-data/favorites";

import { LibraryListView } from "./library-list-view";
import { SignedInGate } from "./signed-in-gate";
import { SongCollection, SongCollectionSkeleton } from "./song-collection";
import { useLikedSongs } from "./use-liked-songs";
import { useStillLiked } from "./use-still-liked";

/** Unliking hides the row in the same frame (`useStillLiked`). */
function LikedSongRow({ song, play }: { song: SongRowItem; play: () => void }) {
  const { toggle } = useFavoriteToggle({ type: "song", token: song.id });

  return (
    <SongRow
      song={song}
      onPress={play}
      removal={{ title: "Remove from Liked Songs", onRemove: toggle }}
      trailingSwipe={{
        label: "Unlike",
        icon: { ios: "heart.slash", android: "heart_broken" },
        tone: "red",
        removes: true,
        onPress: toggle,
      }}
    />
  );
}

const NONE: readonly SongRowItem[] = [];

function LikedSongs() {
  const resolved = useLikedSongs();
  const stillLiked = useStillLiked(
    "song",
    resolved.status === "ready" ? resolved.items : NONE,
  );
  const list =
    resolved.status === "ready" ? { ...resolved, items: stillLiked } : resolved;

  return (
    <LibraryListView
      list={list}
      skeleton={<SongCollectionSkeleton />}
      empty={{
        icon: { ios: "heart", android: "favorite_border" },
        title: "No liked songs yet",
        message: "Tap the heart on any song and it will show up here.",
      }}
    >
      {({ items, missing, refresh }) => (
        <SongCollection
          songs={items}
          missing={missing}
          onRefresh={refresh}
          recentLabel="Recently liked"
          renderRow={(song, play) => (
            <LikedSongRow key={song.id} song={song} play={play} />
          )}
        />
      )}
    </LibraryListView>
  );
}

export function LikedSongsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Liked Songs" }} />
      <SignedInGate>
        <LikedSongs />
      </SignedInGate>
    </>
  );
}
