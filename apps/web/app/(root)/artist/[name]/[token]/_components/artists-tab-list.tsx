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
    <TabsList className="mx-auto flex w-fit lg:mx-0 lg:*:w-1/3 lg:*:px-5">
      {Object.values(TABS).map((tab) => {
        if (!showBio && tab === TABS.Biography) return null;

        return (
          <TabsTrigger
            key={tab}
            value={tab}
            onClick={() => router.push(hrefFor(tab))}
          >
            {tab}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
