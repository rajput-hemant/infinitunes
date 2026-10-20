import { Stack } from "expo-router";

/** Sign-in flow, presented modally over the tabs (see the root layout). */
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: "Sign in" }} />
      <Stack.Screen name="signup" options={{ title: "Create account" }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: "Reset password" }}
      />
    </Stack>
  );
}
