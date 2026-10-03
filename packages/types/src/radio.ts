import type { Radio } from "./get";
import type { Song } from "./song";

export type RadioType = "featured" | "artist" | "song";

export type ActiveRadioSession = {
  stationId: string;
  name: string;
  type: RadioType;
  language?: string;
};

export type StationDetailsResponse = {
  station: Radio;
  stationId: string;
  songs: Song[];
};
