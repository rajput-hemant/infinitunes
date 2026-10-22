import { Text } from "./ui/text";

/** The muted line under a paged list that has no more pages (catalog grids, search type results). */
export function EndOfList({ children }: { children: string }) {
  return (
    <Text variant="subhead" tone="muted" className="py-6 text-center">
      {children}
    </Text>
  );
}
