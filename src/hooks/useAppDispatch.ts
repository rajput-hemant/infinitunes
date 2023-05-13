import { useDispatch } from "react-redux";

import { AppDispatch } from "@/store";

/**
 * https://redux.js.org/usage/usage-with-typescript#define-typed-hooks
 */
export const useAppDispatch: () => AppDispatch = useDispatch;
