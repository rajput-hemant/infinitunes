import { EmptyState } from "~/components/empty-state";

/** Route reserved for the mix screen; its screen agent replaces this body. */
export default function MixScreen() {
  return (
    <EmptyState
      icon={{ ios: "shuffle", android: "shuffle" }}
      title="Mix"
      message="This screen is coming soon."
    />
  );
}
