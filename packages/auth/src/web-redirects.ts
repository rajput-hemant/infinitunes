import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";

/** Request fields Better Auth redirects the user to after a flow. */
const REDIRECT_FIELDS = [
  "callbackURL",
  "errorCallbackURL",
  "newUserCallbackURL",
  "redirectTo",
] as const;

/** An absolute URL whose scheme is not http(s), e.g. `infinitunes://reset`. */
export function isAppSchemeUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  let protocol: string;
  try {
    protocol = new URL(value).protocol;
  } catch {
    // Relative or malformed: Better Auth's own origin check judges it.
    return false;
  }
  return protocol !== "http:" && protocol !== "https:";
}

function hasAppSchemeRedirect(source: unknown): boolean {
  if (typeof source !== "object" || source === null) return false;
  const fields: Record<string, unknown> = { ...source };
  return REDIRECT_FIELDS.some((field) => isAppSchemeUrl(fields[field]));
}

/**
 * Keeps every redirect on the web. The native app's scheme is a trusted
 * origin (its requests carry it), and Better Auth checks origins and redirect
 * targets against one list, so without this a reset link could be sent to
 * `infinitunes://...?token=...`. Any installed app can claim a custom scheme,
 * so tokens and session cookies must never travel through one. Native social
 * sign-in should use the ID token flow, which needs no redirect.
 */
export function webRedirectsOnly() {
  return {
    id: "web-redirects-only",
    hooks: {
      before: [
        {
          matcher: () => true,
          handler: createAuthMiddleware(async (ctx) => {
            if (
              hasAppSchemeRedirect(ctx.body) ||
              hasAppSchemeRedirect(ctx.query)
            ) {
              throw new APIError("FORBIDDEN", {
                message: "Redirects must stay on the web app",
              });
            }
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
}
