import { View } from "react-native";
import Animated from "react-native-reanimated";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { CONTENT_REVEAL, SongListSkeleton } from "~/components/skeletons";
import { Spinner } from "~/components/ui/spinner";

type PagedFooterProps = {
  isPending: boolean;
  error: unknown;
  isFetchingNextPage: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  onRetry: () => void;
};

/** What closes a paged list: its first load, a failed load, no results, or the next page arriving. */
export function PagedFooter({
  isPending,
  error,
  isFetchingNextPage,
  isEmpty,
  emptyTitle,
  onRetry,
}: PagedFooterProps) {
  // The skeleton gives way to these two with a fade, not a pop.
  if (error && isEmpty) {
    return (
      <Animated.View entering={CONTENT_REVEAL}>
        <ErrorState error={error} onRetry={onRetry} />
      </Animated.View>
    );
  }
  if (isPending) return <SongListSkeleton />;
  if (isEmpty) {
    return (
      <Animated.View entering={CONTENT_REVEAL}>
        <EmptyState
          icon={{ ios: "music.note.list", android: "queue_music" }}
          title={emptyTitle}
        />
      </Animated.View>
    );
  }
  if (isFetchingNextPage) {
    return (
      <View className="py-4">
        <Spinner />
      </View>
    );
  }
  return null;
}
