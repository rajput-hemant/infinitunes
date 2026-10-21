import { getErrorCode } from "@infinitunes/core/error-code";

export function isNotFound(error: unknown): boolean {
  return getErrorCode(error) === "NOT_FOUND";
}
