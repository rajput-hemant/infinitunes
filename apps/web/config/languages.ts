import { LANGUAGES } from "@infinitunes/types";

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const languages = LANGUAGES.map((language) => capitalize(language));

export type Language = (typeof languages)[number];
