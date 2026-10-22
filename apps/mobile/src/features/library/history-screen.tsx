import { Stack } from "expo-router";

import { SongRow } from "~/components/song-row";

import { LibraryListView } from "./library-list-view";
import { SignedInGate } from "./signed-in-gate";
import { SongCollection, SongCollectionSkeleton } from "./song-collection";
import { useHistory } from "./use-history";

function History() {
  const list = useHistory();

  return (
    <LibraryListView
      list={list}
      skeleton={<SongCollectionSkeleton />}
      empty={{
        icon: { ios: "clock", android: "history" },
        title: "Nothing played yet",
        message:
          "Songs and episodes you listen to will show up here, newest first.",
      }}
    >
      {({ items, missing, refresh }) => (
        <SongCollection
          songs={items}
          missing={missing}
          onRefresh={refresh}
          recentLabel="Recently played"
          renderRow={(song, play) => (
            <SongRow key={song.id} song={song} onPress={play} />
          )}
        />
      )}
    </LibraryListView>
  );
}

export function HistoryScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Recently Played" }} />
      <SignedInGate>
        <History />
      </SignedInGate>
    </>
  );
}
