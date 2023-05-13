import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { Album, Artist, Chart, PlaylistV2, Song, Trending } from "@/types";

type InitialState = {
  homeData: {
    trending: Trending;
    albums: Album[];
    playlists: PlaylistV2[];
    charts: Chart[];
  } | null;
  artists: Artist[];
  songs: Song[];
};

const initialState: InitialState = {
  homeData: null,
  artists: [],
  songs: [],
};

const RootSlice = createSlice({
  name: "root",

  initialState,

  reducers: {
    setHomeData: (state, action: PayloadAction<InitialState["homeData"]>) => {
      state.homeData = action.payload;
    },
  },
});

export const { setHomeData } = RootSlice.actions;

export default RootSlice.reducer;
