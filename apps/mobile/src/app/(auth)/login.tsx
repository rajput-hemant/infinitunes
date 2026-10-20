import { Link } from "expo-router";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Text } from "~/components/ui/text";

export default function LoginScreen() {
  return (
    <ScreenScrollView contentContainerClassName="gap-4 p-page">
      <Link href="/signup">
        <Text>Create an account</Text>
      </Link>
      <Link href="/forgot-password">
        <Text tone="muted">Forgot password?</Text>
      </Link>
    </ScreenScrollView>
  );
}
