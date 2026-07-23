import {
  albumRouter,
  artistRouter,
  getRouter,
  homeRouter,
  playlistRouter,
  searchRouter,
  showRouter,
  songRouter,
} from "./router";
import { router } from "./trpc";

export const appRouter = router({
  home: homeRouter,
  song: songRouter,
  album: albumRouter,
  playlist: playlistRouter,
  artist: artistRouter,
  show: showRouter,
  search: searchRouter,
  get: getRouter,
});

export type AppRouter = typeof appRouter;
