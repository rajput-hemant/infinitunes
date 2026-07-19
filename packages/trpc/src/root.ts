import { homeRouter } from "./router";
import { albumRouter } from "./router/index";
import { artistRouter } from "./router/index";
import { getRouter } from "./router/index";
import { playlistRouter } from "./router/index";
import { searchRouter } from "./router/index";
import { showRouter } from "./router/index";
import { songRouter } from "./router/index";
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
