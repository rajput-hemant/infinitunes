import { configureStore } from "@reduxjs/toolkit";

import searchSliceReducer from "./search-slice";

const store = configureStore({
	reducer: { search: searchSliceReducer },
});

export default store;
