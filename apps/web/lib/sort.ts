import type { Sort } from "@infinitunes/types";

/** The `?sort=` value as `"asc" | "desc"`: anything else (or repeated) is newest first. */
export function readSort(value: string | string[] | undefined): Sort {
  return value === "asc" ? "asc" : "desc";
}
