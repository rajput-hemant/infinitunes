import { createStore, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { Lang, Theme } from "@/types";

type Config = {
  theme: {
    name: Theme["name"];
    radius: number;
  };
  languages: Lang[];
};

const store = createStore();

const configAtom = atomWithStorage<Config>("config", {
  theme: {
    name: "zinc",
    radius: 0.5,
  },
  languages: ["hindi", "english"],
});

export function useConfig() {
  return useAtom(configAtom, { store });
}
