import { NATIVE_APP_ID, parseFingerprints } from "@infinitunes/auth/native-app";

import { env } from "~/lib/env";

/**
 * Lets the Android app use this domain's passkeys through Credential Manager.
 * Served only once `ANDROID_CERT_SHA256_FINGERPRINTS` is set; the same value
 * makes the server accept the app's passkey origin.
 */
export function GET() {
  const fingerprints = parseFingerprints(env.ANDROID_CERT_SHA256_FINGERPRINTS);
  if (!fingerprints.length) return new Response(null, { status: 404 });
  return Response.json([
    {
      relation: ["delegate_permission/common.get_login_creds"],
      target: {
        namespace: "android_app",
        package_name: NATIVE_APP_ID,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
}
