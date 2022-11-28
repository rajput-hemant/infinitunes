import { createSlice } from "@reduxjs/toolkit";

const searchInitState = {
	searchInput: "",
};

const searchSlice = createSlice({
	name: "search",
	initialState: searchInitState,
	reducers: {
		updateSearchInput(state, action) {
			state.searchInput = action.payload;
		},
	},
});

export const searchActions = searchSlice.actions;

export default searchSlice.reducer;
