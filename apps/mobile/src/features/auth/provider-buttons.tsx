import * as AppleAuthentication from "expo-apple-authentication";
import { useState } from "react";
import { useColorScheme, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { FormError } from "~/components/form/form-error";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import type { AuthFailure } from "~/lib/auth-failure";
import { iconSize, sizes } from "~/theme/tokens";

import {
  signInWithApple,
  signInWithGoogle,
  signInWithPasskey,
  useSignInProviders,
} from "./provider-sign-in";

/** Google's "G", which its branding rules put on the button. */
function GoogleMark() {
  return (
    <Svg width={iconSize.md} height={iconSize.md} viewBox="0 0 18 18">
      <Path
        fill="#EA4335"
        d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"
      />
      <Path
        fill="#4285F4"
        d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <Path
        fill="#FBBC05"
        d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"
      />
      <Path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"
      />
    </Svg>
  );
}

type ProviderButtonsProps = {
  /** `signup` words Apple's button "Sign up" and drops the passkey, which cannot create an account. */
  purpose: "signin" | "signup";
  /** The form's `usePending`: one sign-in at a time, email or provider. */
  pending: boolean;
  run: (task: () => Promise<void>) => Promise<void>;
};

/**
 * The provider buttons above the email form, then an "or" rule: Apple
 * (Apple's own button, black or white with the scheme), Google, a passkey.
 * A refusal shows under them (the email field keeps its focus); a dismissed
 * system sheet shows nothing. Nothing at all when this build and server
 * offer no provider.
 */
export function ProviderButtons({
  purpose,
  pending,
  run,
}: ProviderButtonsProps) {
  const providers = useSignInProviders();
  const scheme = useColorScheme();
  const [error, setError] = useState<string>();
  const passkey = providers.passkey && purpose === "signin";
  if (!providers.apple && !providers.google && !passkey) return null;

  function signIn(provider: () => Promise<AuthFailure | undefined>) {
    void run(async () => setError((await provider())?.message));
  }

  return (
    <View className="gap-3">
      {providers.apple ? (
        <View
          pointerEvents={pending ? "none" : "auto"}
          className={pending ? "opacity-50" : undefined}
        >
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              purpose === "signup"
                ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                : AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
            }
            buttonStyle={
              scheme === "dark"
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            // A capsule, like the app's other buttons.
            cornerRadius={sizes.touch / 2}
            style={{ height: sizes.touch }}
            onPress={() => signIn(signInWithApple)}
          />
        </View>
      ) : null}
      {providers.google ? (
        <Button
          variant="secondary"
          label="Continue with Google"
          leading={<GoogleMark />}
          disabled={pending}
          onPress={() => signIn(signInWithGoogle)}
        />
      ) : null}
      {passkey ? (
        <Button
          variant="secondary"
          label="Sign in with a passkey"
          icon={{ ios: "person.badge.key.fill", android: "passkey" }}
          disabled={pending}
          onPress={() => signIn(signInWithPasskey)}
        />
      ) : null}
      <FormError message={error} />
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text variant="footnote" tone="muted">
          or
        </Text>
        <View className="h-px flex-1 bg-border" />
      </View>
    </View>
  );
}
