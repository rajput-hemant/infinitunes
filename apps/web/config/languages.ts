export const languages = [
  "Hindi",
  "English",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Kannada",
  "Bhojpuri",
  "Malayalam",
  "Urdu",
  "Haryanvi",
  "Rajasthani",
  "Odia",
  "Assamese",
] as const;

export type Language = Lowercase<(typeof languages)[number]>;
