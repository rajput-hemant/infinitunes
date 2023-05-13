import { configureStore } from "@reduxjs/toolkit";

import playerSliceReducer from "./player-slice";
import rootSliceReducer from "./root-slice";
import searchSliceReducer from "./search-slice";

export const store = configureStore({
  reducer: {
    root: rootSliceReducer,
    search: searchSliceReducer,
    player: playerSliceReducer,
  },
});

// https://redux.js.org/usage/usage-with-typescript#define-root-state-and-dispatch-types
export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
