import { Disc3, Library, Palette } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

import { SearchRow } from "./search-row";
import { searchUi } from "./search-ui";

type GoToLink = {
  href: Route;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

const GO_TO_LINKS: readonly GoToLink[] = [
  { href: "/chart", title: "Top Charts", subtitle: "Page", icon: Disc3 },
  { href: "/me", title: "Library", subtitle: "Page", icon: Library },
  {
    href: "/settings/appearance",
    title: "Appearance",
    subtitle: "Settings",
    icon: Palette,
  },
];

type SearchGoToProps = {
  labelId: string;
  onSelect: () => void;
};

/** The palette's idle "Go to" group: fixed pages, listed as options like the other groups. */
export function SearchGoTo({ labelId, onSelect }: SearchGoToProps) {
  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- listbox option group, no native element fits
    <div role="group" aria-labelledby={labelId}>
      <div id={labelId} className={searchUi.groupLabel}>
        Go to
      </div>
      {GO_TO_LINKS.map((link) => (
        <SearchRow
          key={link.href}
          option
          href={link.href}
          title={link.title}
          subtitle={link.subtitle}
          visual={{ kind: "icon", icon: link.icon }}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
