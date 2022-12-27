import { configureStore } from "@reduxjs/toolkit";

import playerSliceReducer from "./player-slice";
import searchSliceReducer from "./search-slice";

const store = configureStore({
	reducer: { search: searchSliceReducer, player: playerSliceReducer },
});

export default store;
