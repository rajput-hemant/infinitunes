import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState = {
  query: "",
};

const SearchSlice = createSlice({
  name: "search",
  initialState,

  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
  },
});

export const { setSearch } = SearchSlice.actions;

export default SearchSlice.reducer;
