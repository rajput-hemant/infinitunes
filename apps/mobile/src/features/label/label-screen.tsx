import { decode } from "@infinitunes/types";

import { DetailFrame } from "~/components/detail/detail-frame";

import { LabelContent } from "./label-content";
import { LabelSkeleton } from "./label-skeleton";
import { useLabel } from "./use-label";

/** The label behind a route token: loading, not found, failed, or the label. */
export function LabelScreen({ token }: { token: string }) {
  const query = useLabel(token);

  return (
    <DetailFrame
      query={query}
      skeleton={<LabelSkeleton />}
      noun="Label"
      icon={{ ios: "opticaldisc", android: "album" }}
      identity={(label) => ({
        name: decode(label.name),
        type: "label",
        // A label has no `perma_url`; its albums URL is the page the web opens first.
        url: label.urls.albums,
      })}
    >
      {(label) => <LabelContent label={label} onRefresh={query.refetch} />}
    </DetailFrame>
  );
}
