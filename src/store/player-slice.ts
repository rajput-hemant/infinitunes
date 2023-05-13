import { createSlice } from "@reduxjs/toolkit";

const playerInitState = {
  songData: {
    src: "",
    title: "",
    image: "",
    artists: "",
  },
  playlistData: [],
  isPlaying: false,
};

const playerSlice = createSlice({
  name: "player",
  initialState: playerInitState,
  reducers: {
    SET_SONG_DATA(state, action) {
      state.songData = action.payload;
    },
    SET_PLAYLIST_SRC(state, action) {
      state.playlistData = action.payload;
    },
    PLAY(state) {
      state.isPlaying = true;
    },
    PAUSE(state) {
      state.isPlaying = false;
    },
  },
});

export const playerActions = playerSlice.actions;

export default playerSlice.reducer;
