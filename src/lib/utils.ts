import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges the given class names with the tailwind classes
 * @param inputs The class names to merge
 * @returns The merged class names
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

/**
 * Clears the given url of any special characters and replaces spaces with hyphens
 * @param url The url to clear
 * @returns The cleared url
 */
export const clearUrl = (url: string) =>
  url
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replaceAll(" ", "-")
    .replaceAll("--", "-");

/**
 * Converts the given string to base64
 * @param str The string to convert
 * @returns The converted string in base64
 */
export const strToBase64 = (str: string) => {
  const encodedStr = encodeURIComponent(str);

  return btoa(encodedStr);
};

/**
 * Checks if the given url is a valid JioSaavn link
 * @param url The url to check
 * @returns true if the url is valid
 */
export const isJioSaavnLink = (url: string) => {
  const regex =
    /^(https?:\/\/)?(www.)?jiosaavn\.com\/(song|shows|album|artist|featured)\/(.+)$/;

  return regex.test(url);
};
