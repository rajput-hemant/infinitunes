import type { MetadataRoute } from "next";

import { THEME_COLOR } from "~/lib/theme-color";

// A manifest is static and cannot follow the color scheme: installed-app
// chrome uses the light default. The page itself keeps `theme-color` in sync.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Infinitunes",
    short_name: "Infinitunes",
    start_url: "/",
    icons: [
      { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    theme_color: THEME_COLOR.light,
    background_color: THEME_COLOR.light,
    display: "standalone",
  };
}
