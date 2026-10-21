import { ActivityIndicator, View } from "react-native";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { SongListSkeleton } from "~/components/skeletons";

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
  if (error && isEmpty) return <ErrorState error={error} onRetry={onRetry} />;
  if (isPending) return <SongListSkeleton />;
  if (isEmpty) {
    return (
      <EmptyState
        icon={{ ios: "music.note.list", android: "queue_music" }}
        title={emptyTitle}
      />
    );
  }
  if (isFetchingNextPage) {
    return (
      <View className="py-4">
        <ActivityIndicator />
      </View>
    );
  }
  return null;
}
