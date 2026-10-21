import { SectionHeader } from "./section-header";

/** @deprecated Use `SectionHeader` (`<SectionHeader title="Lyrics" />`). */
export function SectionHeading({ children }: { children: string }) {
  return <SectionHeader title={children} />;
}
