// Kept free of zod and @infinitunes/env on purpose: this module is in every
// client bundle. The fallback mirrors NEXT_PUBLIC_APP_URL's default in
// packages/env/src/schema.ts, and lib/env.ts still validates the value at build.
const DEFAULT_APP_URL = "https://infinitunes.rajputhemant.me";

export const siteConfig = {
  name: "Infinitunes",
  url: process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
  description:
    "A Simple Music Player Web App built using Next.js, shadcn/ui, TailwindCSS, DrizzleORM and more...",

  author: {
    x: "@rajput_hemant01",
  },

  links: {
    github: "https://github.com/rajput-hemant/infinitunes",
    x: "https://twitter.com/rajput_hemant01",
  },
};
