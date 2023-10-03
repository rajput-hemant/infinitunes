import { createStore, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { Style } from "@/types/style";
import { Theme } from "@/types/theme";

type Config = {
  theme: {
    name: Theme["name"];
    style: Style["name"];
    radius: number;
  };
};

const store = createStore();

const configAtom = atomWithStorage<Config>("config", {
  theme: {
    name: "zinc",
    style: "default",
    radius: 0.5,
  },
});

export function useConfig() {
  return useAtom(configAtom, { store });
}
