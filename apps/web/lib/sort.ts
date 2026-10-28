import type { Sort } from "@infinitunes/types";

export const DEFAULT_SORT: Sort = "desc";

/** The `?sort=` value as `"asc" | "desc"`: anything else (or repeated) is newest first. */
export function readSort(value: string | string[] | undefined): Sort {
  return value === "asc" ? "asc" : DEFAULT_SORT;
}
