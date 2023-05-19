import { api } from "@/api/jiosaavn";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { Song } from "@/types";

type InitialState = {
  song: Song | null;
  playlist: Song[] | null;
  isPlaying: boolean;
  isLooping?: boolean;
  isShuffling?: boolean;
};

const initialState: InitialState = {
  song: null,
  playlist: null,
  isPlaying: false,
  isLooping: false,
  isShuffling: false,
};

// an async thunk to fetch song details asynchronously
export const getSongAsync = createAsyncThunk(
  "root/getSongAsync",

  async (id: string) => {
    try {
      const song = await api.getSongDetails(id);

      return song;
    } catch (error) {
      console.error("Error fetching song details:", error);
    }
  }
);

const PlayerSlice = createSlice({
  name: "player",

  initialState,

  reducers: {
    /** Set audio source */
    setSong: (state, action: PayloadAction<InitialState["song"]>) => {
      state.song = action.payload;
    },

    /** Set playlist */
    setPlaylist: (state, action: PayloadAction<InitialState["playlist"]>) => {
      state.playlist = action.payload;
    },

    /** Set is audio playing */
    setAudioIsPlaying: (
      state,
      action: PayloadAction<InitialState["isPlaying"]>
    ) => {
      state.isPlaying = action.payload;
    },

    /** Set is audio looping */
    setAudioIsLooping: (
      state,
      action: PayloadAction<InitialState["isLooping"]>
    ) => {
      state.isLooping = action.payload;
    },

    /** Set is audio shuffling */
    setAudioIsShuffling: (
      state,
      action: PayloadAction<InitialState["isShuffling"]>
    ) => {
      state.isShuffling = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getSongAsync.fulfilled, (state, action) => {
      if (action.payload) {
        state.song = action.payload;
      }
    });
  },
});

export const { setSong, setAudioIsPlaying, setPlaylist } = PlayerSlice.actions;

export default PlayerSlice.reducer;
