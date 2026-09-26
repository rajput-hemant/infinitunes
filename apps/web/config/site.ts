import { createClientEnv } from "@infinitunes/env/client";

const env = createClientEnv({
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});

export const siteConfig = {
  name: "Infinitunes",
  url: env.NEXT_PUBLIC_APP_URL,
  description:
    "A Simple Music Player Web App built using Next.js, shadcn/ui, TailwindCSS, DrizzleORM and more...",

  author: {
    name: "Hemant Rajput",
    url: "https://rajputhemant.me",
    email: "68769346+rajput-hemant@users.noreply.github.com",
    x: "@rajput_hemant01",
  },

  links: {
    github: "https://github.com/rajput-hemant/infinitunes",
    discord: "https://discord.gg/rajput-hemant#8269",
    x: "https://twitter.com/rajput_hemant01",
  },
};

export type SiteConfig = typeof siteConfig;
