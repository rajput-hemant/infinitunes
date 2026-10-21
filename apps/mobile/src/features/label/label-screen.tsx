import { decode } from "@infinitunes/types";
import { Stack } from "expo-router";

import { DetailFailure } from "~/features/artist/detail-failure";
import { detailHeaderOptions } from "~/features/artist/detail-header-options";

import { LabelContent } from "./label-content";
import { LabelSkeleton } from "./label-skeleton";
import { useLabel } from "./use-label";

/** The label behind a route token: loading, not found, failed, or the label. */
export function LabelScreen({ token }: { token: string }) {
  const {
    data: label,
    error,
    isPending,
    isRefetching,
    refetch,
  } = useLabel(token);

  if (label) {
    return (
      <>
        <Stack.Screen
          options={detailHeaderOptions({
            name: decode(label.name),
            // A label has no `perma_url`; its albums URL is the page the web opens first.
            url: label.urls.albums,
          })}
        />
        <LabelContent
          label={label}
          onRefresh={refetch}
          isRefreshing={isRefetching}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={detailHeaderOptions()} />
      {isPending ? (
        <LabelSkeleton />
      ) : (
        <DetailFailure
          noun="Label"
          icon={{ ios: "opticaldisc", android: "album" }}
          error={error}
          onRetry={() => void refetch()}
        />
      )}
    </>
  );
}
