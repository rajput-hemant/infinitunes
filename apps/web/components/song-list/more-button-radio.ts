import { toQueue } from "@infinitunes/types";
import { toast } from "sonner";

import { getItemName } from "~/components/song-list/item-name";
import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { api } from "~/lib/trpc/client";

import { getItemArtists, type TileMoreItem } from "./more-button-item";

export function useTileRadio(item: TileMoreItem) {
  const [, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setActiveRadio] = useActiveRadioSession();

  const utils = api.useUtils();

  async function playRadio() {
    try {
      toast.loading("Starting radio...", { id: "song-radio" });
      const artists = getItemArtists(item);
      const primary = artists?.[0];
      const artistName = primary?.name;
      const artistId = primary?.id;

      const stationName = artistName || getItemName(item);
      const radioType: "artist" | "featured" = artistName
        ? "artist"
        : "featured";

      const { stationId } = await utils.client.radio.createStation.mutate({
        type: radioType,
        name: stationName,
        artistId,
        language:
          "language" in item && typeof item.language === "string"
            ? item.language
            : undefined,
      });

      const radioSongs = await utils.radio.songs.fetch({
        stationId,
        k: 20,
      });

      if (!radioSongs.length) {
        toast.error("Could not find songs for this radio", {
          id: "song-radio",
        });
        return;
      }

      const radioQueue = radioSongs.map(toQueue);
      setQueue(radioQueue);
      setActiveRadio({
        stationId,
        name: `${stationName} Radio`,
        type: radioType,
      });
      setCurrentIndex(0);
      setIsPlayerInit(true);

      toast.success(`Playing "${stationName} Radio"`, {
        id: "song-radio",
        description: `Added ${radioQueue.length} station tracks to queue`,
      });
    } catch {
      toast.error("Unable to start radio station", { id: "song-radio" });
    }
  }

  return playRadio;
}
