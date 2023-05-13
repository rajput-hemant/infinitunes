import { api } from "@/api/jiosaavn";

import { store } from "@/store";

export const getHomeData = async () => {
  const homeData = store.getState().root.homeData ?? (await api.getHomeData());

  return (
    homeData && {
      trending: [...homeData.trending.albums, ...homeData.trending.songs],
      albums: homeData.albums,
      playlists: homeData.playlists,
      charts: homeData.charts,
    }
  );
};
