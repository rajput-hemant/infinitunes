import { usePlaylists } from "@infinitunes/core/react/optimistic-playlists";
import { userMessage } from "@infinitunes/core/user-message";
import { RefreshControl, View } from "react-native";
import { toast } from "sonner-native";

import { ErrorState } from "~/components/error-state";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { SongListSkeleton } from "~/components/skeletons";
import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { useServerPlaylists } from "~/user-data/playlists";

import { LibraryRow } from "./library-row";
import { LIBRARY_SHORTCUTS } from "./library-shortcuts";
import { PlaylistRow } from "./playlist-row";
import { SignedInGate } from "./signed-in-gate";

function Playlists() {
  const { data, error, isPending, refetch } = useServerPlaylists();
  const playlists = usePlaylists(data);

  if (isPending) return <SongListSkeleton rows={3} />;
  if (!playlists) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <>
      <LibraryRow
        icon={{ ios: "plus", android: "add" }}
        title="New Playlist"
        href="/me/new-playlist"
      />
      {playlists.length === 0 ? (
        <Text tone="muted" className="px-page py-2">
          Collect songs you love into playlists you can play any time.
        </Text>
      ) : (
        playlists.map((playlist) => (
          <PlaylistRow key={playlist.id} playlist={playlist} />
        ))
      )}
    </>
  );
}

function Library() {
  const { isRefetching, refetch } = useServerPlaylists();

  async function refresh() {
    const result = await refetch();
    if (result.isError) toast.error(userMessage(result.error));
  }

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refresh()}
        />
      }
    >
      {LIBRARY_SHORTCUTS.map(({ title, icon, href }) => (
        <LibraryRow
          key={title}
          icon={icon}
          title={title}
          href={href}
          trailing={
            <View className="size-ctl items-center justify-center">
              <Icon
                name={{ ios: "chevron.forward", android: "chevron_right" }}
                size={14}
              />
            </View>
          }
        />
      ))}
      <Text
        variant="title"
        accessibilityRole="header"
        className="px-page pb-1 pt-4"
      >
        Playlists
      </Text>
      <Playlists />
    </ScreenScrollView>
  );
}

/** The Library tab: the listener's saved lists and playlists, or a way to sign in. */
export function LibraryScreen() {
  return (
    <SignedInGate>
      <Library />
    </SignedInGate>
  );
}
