import {
  albumRouter,
  artistRouter,
  getRouter,
  historyRouter,
  homeRouter,
  playlistRouter,
  searchRouter,
  showRouter,
  songRouter,
  radioRouter,
  userRouter,
} from "./router";
import { router } from "./trpc";

export const appRouter = router({
  home: homeRouter,
  history: historyRouter,
  song: songRouter,
  album: albumRouter,
  playlist: playlistRouter,
  artist: artistRouter,
  show: showRouter,
  search: searchRouter,
  get: getRouter,
  radio: radioRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
