/// <reference types="nativewind/types" />

// NativeWind 4 ships an empty declaration file for its Tailwind preset.
declare module "nativewind/preset" {
  import type { Config } from "tailwindcss";

  const preset: Partial<Config>;
  export default preset;
}
