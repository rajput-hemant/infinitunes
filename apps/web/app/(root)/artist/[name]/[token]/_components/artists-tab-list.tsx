"use client";

import { TabsList, TabsTrigger } from "@infinitunes/ui/components/tabs";
import { usePathname, useRouter } from "next/navigation";

import { asRoute } from "~/lib/utils";

import { TABS } from "./tabs";

const TAB_SUFFIX: Record<TABS, string> = {
  [TABS.Overview]: "",
  [TABS.Songs]: "-songs",
  [TABS.Albums]: "-albums",
  [TABS.Biography]: "-bio",
};

type ArtistsTabListProps = { showBio: boolean };

export function ArtistsTabList({ showBio }: ArtistsTabListProps) {
  const router = useRouter();
  const segments = usePathname().split("/");

  const hrefFor = (tab: TABS) => {
    segments[2] =
      segments[2].replace(/(-songs|-albums|-bio)/, "") + TAB_SUFFIX[tab];

    return asRoute(segments.join("/"));
  };

  return (
    <TabsList
      variant="line"
      className="mb-4 w-full justify-start gap-6 overflow-x-auto border-b border-border p-0 [scrollbar-width:none] group-data-[orientation=horizontal]/tabs:h-auto [&::-webkit-scrollbar]:hidden"
    >
      {Object.values(TABS).map((tab) => {
        if (!showBio && tab === TABS.Biography) return null;

        return (
          <TabsTrigger
            key={tab}
            value={tab}
            onClick={() => router.push(hrefFor(tab))}
            className="h-10 flex-none rounded-none px-0 font-semibold text-muted-foreground after:rounded-full after:bg-primary group-data-[orientation=horizontal]/tabs:after:-bottom-px data-active:text-foreground pointer-coarse:h-11"
          >
            {tab}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
