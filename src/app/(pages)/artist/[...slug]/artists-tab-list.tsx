"use client";

import { usePathname, useRouter } from "next/navigation";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TABS } from "./tabs";

type Props = { showBio: boolean };

const ArtistsTabList = ({ showBio }: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  const hrefConstructor = (tab: string) => {
    const suffixMap = {
      [TABS.Overview]: "",
      [TABS.Songs]: "-songs",
      [TABS.Albums]: "-albums",
      [TABS.Biography]: "-bio",
    };

    const segments = pathname.split("/");

    segments[2] =
      segments[2].replace(/(-songs|-albums|-bio)/, "") +
      suffixMap[tab as keyof typeof TABS];

    return segments.join("/");
  };

  return (
    <TabsList className="mx-auto mb-4 flex w-fit lg:mx-0">
      {Object.keys(TABS).map((tab, i) => {
        if (showBio && tab === TABS.Biography) return;

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
};

export default ArtistsTabList;
