export enum TABS {
  Overview = "Overview",
  Songs = "Songs",
  Albums = "Albums",
  Biography = "Biography",
}

export function tabForSlug(slug: string | undefined): TABS {
  switch (slug) {
    case "songs":
      return TABS.Songs;
    case "albums":
      return TABS.Albums;
    case "bio":
      return TABS.Biography;
    default:
      return TABS.Overview;
  }
}
