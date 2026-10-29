import { toQueue } from "@infinitunes/types";
import { toast } from "sonner";

import { getItemName } from "~/components/song-list/item-name";
import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { trpc } from "~/lib/trpc/vanilla";

import { getItemArtists, type TileMoreItem } from "./more-button-item";

export type RadioStart = {
  client: typeof trpc;
  setQueue: ReturnType<typeof useQueue>[1];
  setCurrentIndex: ReturnType<typeof useCurrentSongIndex>[1];
  setIsPlayerInit: ReturnType<typeof useIsPlayerInit>[1];
  setActiveRadio: ReturnType<typeof useActiveRadioSession>[1];
};

/** What a station is created from: the row and the details header both reduce to this. */
export type RadioSeed = {
  type: "artist" | "featured";
  name: string;
  artistId?: string;
  language?: string;
};

/**
 * Creates a station from `seed` and starts it. The one "create station then
 * play" path for every "Play Radio" entry. Kept outside the hooks: the React
 * Compiler bails out on try/catch around ternaries and optional chains.
 */
async function startRadio(seed: RadioSeed, radio: RadioStart) {
  const { client, setQueue, setCurrentIndex, setIsPlayerInit, setActiveRadio } =
    radio;
  const { type, name, artistId, language } = seed;

  try {
    toast.loading("Starting radio...", { id: "play-radio" });

    const { stationId } = await client.radio.createStation.mutate({
      type,
      name,
      artistId,
      language,
    });

    const radioSongs = await client.radio.songs.query({
      stationId,
      k: 20,
    });

    if (!radioSongs.length) {
      toast.error("Could not find songs for this radio", {
        id: "play-radio",
      });
      return;
    }

    const radioQueue = radioSongs.map(toQueue);
    setQueue(radioQueue);
    setActiveRadio({
      stationId,
      name: `${name} Radio`,
      type,
      language,
    });
    setCurrentIndex(0);
    setIsPlayerInit(true);

    toast.success(`Playing "${name} Radio"`, {
      id: "play-radio",
      description: `Added ${radioQueue.length} station tracks to queue`,
    });
  } catch {
    toast.error("Unable to start radio station", { id: "play-radio" });
  }
}

/** The artist's station when the row has credits, otherwise one named after the item. */
function tileRadioSeed(item: TileMoreItem): RadioSeed {
  const primary = getItemArtists(item)?.[0];
  const artistName = primary?.name;

  return {
    type: artistName ? "artist" : "featured",
    name: artistName || getItemName(item),
    artistId: primary?.id,
    language: item.language,
  };
}

export function useRadioStart() {
  const [, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setActiveRadio] = useActiveRadioSession();

  return (seed: RadioSeed) =>
    startRadio(seed, {
      client: trpc,
      setQueue,
      setCurrentIndex,
      setIsPlayerInit,
      setActiveRadio,
    });
}

export function useTileRadio(item: TileMoreItem) {
  const start = useRadioStart();

  return () => start(tileRadioSeed(item));
}
