import { EmptyState } from "~/components/empty-state";

/** Route reserved for the label screen; its screen agent replaces this body. */
export default function LabelScreen() {
  return (
    <EmptyState
      icon={{ ios: "building.2", android: "domain" }}
      title="Label"
      message="This screen is coming soon."
    />
  );
}
