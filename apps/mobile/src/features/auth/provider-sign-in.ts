import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";
import type { PasskeyGetRequest } from "react-native-passkey";

import { authClient } from "~/lib/auth-client";
import { authFailure } from "~/lib/auth-failure";
import type { AuthFailure } from "~/lib/auth-failure";
import { env } from "~/lib/env";

import { hasNativeModule } from "./native-presence";

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

// Each package is required only inside these loaders, and only once
// `hasNativeModule` has said its native module is linked: importing a package
// whose native module is missing throws, and the route tree imports this file.
export function loadAppleAuthentication(): typeof import("expo-apple-authentication") {
  return require("expo-apple-authentication");
}

function loadGoogleSignin(): typeof import("@react-native-google-signin/google-signin") {
  return require("@react-native-google-signin/google-signin");
}

function loadPasskey(): typeof import("react-native-passkey") {
  return require("react-native-passkey");
}

function codeOf(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
}

/** A refusal for a provider that answered without an ID token. */
const noToken = { error: { status: 400, message: NO_TOKEN_MESSAGE } };

export function signInWithApple(): Promise<AuthFailure | undefined> {
  return authFailure(async () => {
    const AppleAuthentication = loadAppleAuthentication();
    const Crypto: typeof import("expo-crypto") = require("expo-crypto");
    // Apple signs the nonce's SHA-256 into the token and only the server sees
    // the nonce itself, so a captured token cannot be replayed on its own.
    const nonce = Crypto.randomUUID();
    let credential: import("expo-apple-authentication").AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          nonce,
        ),
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
        nonce,
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
  const { GoogleSignin } = loadGoogleSignin();
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
    const { Passkey } = loadPasskey();
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

/** Whether this build and device can run a passkey sign-in. */
function passkeySupported(): boolean {
  return hasNativeModule("Passkey") && loadPasskey().Passkey.isSupported();
}

/**
 * Which buttons to show: a provider the server has, that this build links the
 * native modules for, and this device can reach. On iOS, Google only with
 * Apple (App Store guideline 4.8). Nothing while the list loads or if it
 * fails: email and password still work.
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
  const apple =
    ios &&
    env.applePaidTeam &&
    server.includes("apple") &&
    hasNativeModule("ExpoAppleAuthentication") &&
    hasNativeModule("ExpoCrypto");
  const google =
    server.includes("google") &&
    Boolean(env.googleWebClientId) &&
    hasNativeModule("RNGoogleSignin") &&
    (ios ? apple && Boolean(env.googleIosClientId) : true);
  return {
    apple,
    google,
    passkey: env.passkeys && (!ios || env.applePaidTeam) && passkeySupported(),
  };
}
