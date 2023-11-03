import { atom, createStore, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { Lang, Queue, StreamQuality, Theme } from "@/types";

type Config = {
  theme: {
    name: "default" | Theme["name"];
    radius: number;
  };
  languages: Lang[];
  queue: Queue[];
  currentSongId: string | null;
  streamQuality: StreamQuality;
  downloadQuality: StreamQuality;
};

const store = createStore();

const configAtom = atomWithStorage<Config>("config", {
  theme: {
    name: "default",
    radius: 0.5,
  },
  languages: ["hindi", "english"],
  queue: [],
  currentSongId: null,
  streamQuality: "excellent",
  downloadQuality: "excellent",
});

const isPlayingAtom = atom(false);

export function useConfig() {
  return useAtom(configAtom, { store });
}

export function useIsPlayerInit() {
  return useAtom(isPlayingAtom, { store });
}
