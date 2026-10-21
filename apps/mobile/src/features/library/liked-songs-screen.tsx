import type { SongRowItem } from "@infinitunes/types";
import { Stack } from "expo-router";

import { SongListSkeleton } from "~/components/skeletons";
import { SongRow } from "~/components/song-row";
import { useFavoriteToggle } from "~/user-data/favorites";

import { LibraryListView } from "./library-list-view";
import { SignedInGate } from "./signed-in-gate";
import { SongCollection } from "./song-collection";
import { SwipeableRow } from "./swipeable-row";
import { useLikedSongs } from "./use-liked-songs";

/** Unliking hides the row in the same frame; a failed write brings it back. */
function LikedSongRow({ song, play }: { song: SongRowItem; play: () => void }) {
  const { liked, toggle } = useFavoriteToggle({ type: "song", token: song.id });
  if (!liked) return null;

  return (
    <SwipeableRow
      action={{
        label: "Unlike",
        icon: { ios: "heart.slash", android: "heart_broken" },
        onPress: toggle,
      }}
    >
      <SongRow
        song={song}
        onPress={play}
        removal={{ title: "Remove from Liked Songs", onRemove: toggle }}
      />
    </SwipeableRow>
  );
}

function LikedSongs() {
  const list = useLikedSongs();

  return (
    <LibraryListView
      list={list}
      skeleton={<SongListSkeleton />}
      empty={{
        icon: { ios: "heart", android: "favorite_border" },
        title: "No liked songs yet",
        message: "Tap the heart on any song and it will show up here.",
      }}
    >
      {({ items, missing, refreshing, refresh }) => (
        <SongCollection
          songs={items}
          missing={missing}
          refreshing={refreshing}
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
