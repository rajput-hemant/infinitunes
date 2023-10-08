import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { Type } from "@/types";

/**
 * Merges the given class names with the tailwind classes
 * @param inputs The class names to merge
 * @returns The merged class names
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const getHref = (url: string, type: Type) => {
  return `${type}/${url.split("/").slice(4).join("/")}`;
};
