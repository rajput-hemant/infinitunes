import { TypedUseSelectorHook, useSelector } from "react-redux";

import { RootState } from "@/store";

/**
 * https://redux.js.org/usage/usage-with-typescript#define-typed-hooks
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
