import { Text } from "~/components/ui/text";

/** A titled section of a detail page, the size of a shelf's heading. */
export function SectionHeading({ children }: { children: string }) {
  return (
    <Text
      variant="title"
      accessibilityRole="header"
      className="px-page pb-1 pt-3"
    >
      {children}
    </Text>
  );
}
