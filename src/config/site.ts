export const siteConfig = {
  name: "Infinitunes",
  url: "https://infinitunes.vercel.app",
  ogImage: "",
  description: "🎵 A Simple Music Player Web App",
  links: {
    twitter: "https://twitter.com/rajput_hemant01",
    github: "https://github.com/rajput-hemant/infinitunes",
  },
  me: {
    name: "rajput-hemant",
    url: "https://github.com/rajput-hemant",
  },

  mainNav: [
    { title: "Music", href: "/" },
    { title: "Podcasts", href: "/podcasts" },
  ],
};

export type SiteConfig = typeof siteConfig;
