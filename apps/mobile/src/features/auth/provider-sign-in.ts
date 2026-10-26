import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useQuery } from "@tanstack/react-query";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { Passkey } from "react-native-passkey";
import type { PasskeyGetRequest } from "react-native-passkey";

import { authClient } from "~/lib/auth-client";
import { authFailure } from "~/lib/auth-failure";
import type { AuthFailure } from "~/lib/auth-failure";
import { env } from "~/lib/env";

/**
 * Sign-in without a password: Apple and Google hand the app an ID token that
 * the server verifies (no browser, no redirect, so nothing passes through the
 * app's URL scheme), and a passkey answers the server's WebAuthn challenge.
 * Each resolves to what went wrong, or `undefined` on success and when the
 * listener dismissed the system sheet. The session store updates on success.
 */

const NO_TOKEN_MESSAGE = "Sign-in did not complete. Please try again.";

const NO_PASSKEY: AuthFailure = {
  message: "No Infinitunes passkey was found on this device.",
};

/** The empty result of a request the listener cancelled. */
const cancelled = { error: null };

function codeOf(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
}

/** A refusal for a provider that answered without an ID token. */
const noToken = { error: { status: 400, message: NO_TOKEN_MESSAGE } };

export function signInWithApple(): Promise<AuthFailure | undefined> {
  return authFailure(async () => {
    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
    } catch (error) {
      if (codeOf(error) === "ERR_REQUEST_CANCELED") return cancelled;
      throw error;
    }
    const token = credential.identityToken;
    if (!token) return noToken;
    const { givenName, familyName } = credential.fullName ?? {};
    return authClient.signIn.social({
      provider: "apple",
      idToken: {
        token,
        // Apple names the listener on the first sign-in only.
        ...(givenName || familyName
          ? {
              user: {
                name: {
                  firstName: givenName ?? undefined,
                  lastName: familyName ?? undefined,
                },
              },
            }
          : {}),
      },
    });
  });
}

let googleConfigured = false;

export async function signInWithGoogle(): Promise<AuthFailure | undefined> {
  if (!googleConfigured) {
    // The web client makes the ID token's audience the server's client id.
    GoogleSignin.configure({
      webClientId: env.googleWebClientId,
      iosClientId: env.googleIosClientId,
    });
    googleConfigured = true;
  }
  return authFailure(async () => {
    const response = await GoogleSignin.signIn();
    if (response.type === "cancelled") return cancelled;
    const token = response.data.idToken;
    if (!token) return noToken;
    return authClient.signIn.social({ provider: "google", idToken: { token } });
  });
}

export async function signInWithPasskey(): Promise<AuthFailure | undefined> {
  let noPasskey = false;
  const failure = await authFailure(async () => {
    // `$fetch` keeps the challenge cookie and sends it back with the answer.
    const options = await authClient.$fetch<PasskeyGetRequest>(
      "/passkey/generate-authenticate-options",
      { method: "GET" },
    );
    if (options.error) return options;
    let assertion;
    try {
      assertion = await Passkey.get(options.data);
    } catch (error) {
      const reason = (error as { error?: string }).error;
      if (reason === "UserCancelled") return cancelled;
      if (reason === "NoCredentials") {
        noPasskey = true;
        return cancelled;
      }
      throw error;
    }
    return authClient.$fetch("/passkey/verify-authentication", {
      method: "POST",
      // WebAuthn's credential type; the native result may leave it out.
      body: { response: { ...assertion, type: "public-key" } },
    });
  });
  return noPasskey ? NO_PASSKEY : failure;
}

export type SignInProviders = {
  apple: boolean;
  google: boolean;
  passkey: boolean;
};

/**
 * Which buttons to show: a provider the server has and this build can reach.
 * On iOS, Google only with Apple (App Store guideline 4.8). Nothing while the
 * list loads or if it fails: email and password still work.
 */
export function useSignInProviders(): SignInProviders {
  const { data: server = [] } = useQuery({
    queryKey: ["auth", "social-providers"],
    queryFn: async () => {
      const { data, error } =
        await authClient.$fetch<string[]>("/social-providers");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: Infinity,
  });
  const ios = Platform.OS === "ios";
  const apple = ios && env.applePaidTeam && server.includes("apple");
  const google =
    server.includes("google") &&
    Boolean(env.googleWebClientId) &&
    (ios ? apple && Boolean(env.googleIosClientId) : true);
  return {
    apple,
    google,
    passkey:
      env.passkeys && (!ios || env.applePaidTeam) && Passkey.isSupported(),
  };
}
