import { createSlice } from "@reduxjs/toolkit";

const playerInitState = {
	songSrc: "",
	playlistSrc: [],
	isPlaying: false,
};

const playerSlice = createSlice({
	name: "player",
	initialState: playerInitState,
	reducers: {
		SET_SONG_SRC(state, action) {
			state.songSrc = action.payload;
		},
		SET_PLAYLIST_SRC(state, action) {
			state.songSrc = action.payload;
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
