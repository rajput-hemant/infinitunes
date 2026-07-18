"use client";

import { usePathname, useRouter } from "next/navigation";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TABS } from "./tabs";

type ArtistsTabListProps = { showBio: boolean };

export function ArtistsTabList({ showBio }: ArtistsTabListProps) {
  const router = useRouter();
  const segments = usePathname().split("/");

  const hrefConstructor = (tab: string) => {
    const suffixMap = {
      [TABS.Overview]: "",
      [TABS.Songs]: "-songs",
      [TABS.Albums]: "-albums",
      [TABS.Biography]: "-bio",
    };

    segments[2] =
      segments[2].replace(/(-songs|-albums|-bio)/, "") +
      suffixMap[tab as keyof typeof TABS];

    return segments.join("/");
  };

  return (
    <TabsList className="mx-auto flex w-fit lg:mx-0 lg:*:w-1/3 lg:*:px-5">
      {Object.keys(TABS).map((tab, i) => {
        if (!showBio && tab === TABS.Biography) return;

        return (
          <TabsTrigger
            key={i}
            value={tab}
            onClick={() => router.push(hrefConstructor(tab))}
          >
            {tab}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
