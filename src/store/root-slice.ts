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
  player: {
    song: Song | null;
    playlist: Song[] | null;
    isPlaying: boolean;
    isLooping?: boolean;
    isShuffling?: boolean;
  };
};

const initialState: InitialState = {
  homeData: null,
  artists: [],
  songs: [],
  player: {
    song: null,
    playlist: null,
    isPlaying: false,
    isLooping: false,
    isShuffling: false,
  },
};

const RootSlice = createSlice({
  name: "root",

  initialState,

  reducers: {
    /** Set home data*/
    setHomeData: (state, action: PayloadAction<InitialState["homeData"]>) => {
      state.homeData = action.payload;
    },

    /** Set audio source */
    setSong: (state, action: PayloadAction<InitialState["player"]["song"]>) => {
      state.player.song = action.payload;
    },

    /** Set playlist */
    setPlaylist: (
      state,
      action: PayloadAction<InitialState["player"]["playlist"]>
    ) => {
      state.player.playlist = action.payload;
    },

    /** Set is audio playing */
    setAudioIsPlaying: (
      state,
      action: PayloadAction<InitialState["player"]["isPlaying"]>
    ) => {
      state.player.isPlaying = action.payload;
    },

    /** Set is audio looping */
    setAudioIsLooping: (
      state,
      action: PayloadAction<InitialState["player"]["isLooping"]>
    ) => {
      state.player.isLooping = action.payload;
    },

    /** Set is audio shuffling */
    setAudioIsShuffling: (
      state,
      action: PayloadAction<InitialState["player"]["isShuffling"]>
    ) => {
      state.player.isShuffling = action.payload;
    },
  },
});

export const { setHomeData, setSong, setAudioIsPlaying, setPlaylist } =
  RootSlice.actions;

export default RootSlice.reducer;
