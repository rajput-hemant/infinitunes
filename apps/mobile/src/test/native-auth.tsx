import { Pressable, Text } from "react-native";

/**
 * Stand-ins for the native sign-in modules (`src/test/setup.ts` maps them
 * here for every suite): each sheet succeeds until a test scripts a cancel
 * or a failure with `mockRejectedValueOnce` / `mockResolvedValueOnce`.
 */

export const appleAuthentication = {
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  AppleAuthenticationButtonType: { SIGN_IN: 0, CONTINUE: 1, SIGN_UP: 2 },
  AppleAuthenticationButtonStyle: { WHITE: 0, WHITE_OUTLINE: 1, BLACK: 2 },
  signInAsync: jest.fn(async () => ({
    identityToken: "apple-id-token",
    fullName: null,
  })),
  // The native button names itself from its type.
  AppleAuthenticationButton: ({
    buttonType,
    onPress,
  }: {
    buttonType: number;
    onPress: () => void;
  }) => {
    const label =
      buttonType === 2 ? "Sign up with Apple" : "Continue with Apple";
    return (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    );
  },
};

// A fixed nonce and a readable stand-in digest, so tests can trace both.
export const expoCrypto = {
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  randomUUID: jest.fn(() => "nonce-1"),
  digestStringAsync: jest.fn(
    async (algorithm: string, data: string) => `${algorithm}(${data})`,
  ),
};

export const googleSignIn = {
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(async () => ({
      type: "success",
      data: { idToken: "google-id-token" },
    })),
  },
};

/**
 * Which native sign-in modules the build links: all of them, until a test
 * makes one missing (`mockImplementation`). Reset after each test.
 */
export const nativePresence = {
  hasNativeModule: jest.fn((_name: string) => true),
};

export const passkey = {
  Passkey: {
    isSupported: jest.fn(() => true),
    get: jest.fn(async () => ({
      id: "credential-id",
      rawId: "credential-id",
      response: {
        authenticatorData: "authenticator-data",
        clientDataJSON: "client-data",
        signature: "signature",
      },
    })),
  },
};
