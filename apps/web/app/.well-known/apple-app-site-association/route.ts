import { NATIVE_APP_ID } from "@infinitunes/auth/native-app";

import { env } from "~/lib/env";

/**
 * Lets the iOS app use this domain's passkeys (`webcredentials`, the
 * `associatedDomains` entry in `apps/mobile/app.config.ts`). Served only once
 * `APPLE_TEAM_ID` is set.
 */
export function GET() {
  if (!env.APPLE_TEAM_ID) return new Response(null, { status: 404 });
  return Response.json({
    webcredentials: { apps: [`${env.APPLE_TEAM_ID}.${NATIVE_APP_ID}`] },
  });
}
