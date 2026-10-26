import { requireOptionalNativeModule } from "expo";
import { NativeModules, TurboModuleRegistry } from "react-native";

/**
 * The native modules the sign-in providers use, by the name each package
 * registers: `RNGoogleSignin` is Google's TurboModule, `Passkey` the passkey
 * package's legacy native module, the rest are Expo modules.
 */
export type SignInNativeModule =
  | "ExpoAppleAuthentication"
  | "ExpoCrypto"
  | "RNGoogleSignin"
  | "Passkey";

/**
 * Whether this binary links a sign-in module. A build from before a module
 * was added lacks it, and requiring its package then throws at startup, so
 * callers check here first and load the package only on yes.
 */
export function hasNativeModule(name: SignInNativeModule): boolean {
  switch (name) {
    case "RNGoogleSignin":
      return TurboModuleRegistry.get(name) != null;
    case "Passkey":
      return NativeModules.Passkey != null;
    default:
      return requireOptionalNativeModule(name) != null;
  }
}
