import { env } from "~/lib/env";

export const siteConfig = {
  name: "Infinitunes",
  url: env.NEXT_PUBLIC_APP_URL,
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
