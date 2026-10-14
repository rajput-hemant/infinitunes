import { redirectIfSignedIn } from "~/lib/auth-guard";

type SignedInRedirectProps = {
  /** An emailed reset link (`?token=`) stays reachable while signed in. */
  searchParams?: Promise<{ token?: string | string[] }>;
};

/**
 * Sends a signed-in visitor home. It reads the session, so it renders behind
 * `<Suspense>` and the form around it prerenders; the redirect streams in.
 */
export async function SignedInRedirect({
  searchParams,
}: SignedInRedirectProps) {
  if (searchParams && (await searchParams).token) return null;

  await redirectIfSignedIn();

  return null;
}
