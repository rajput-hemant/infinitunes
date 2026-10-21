import { AuthScreen } from "~/features/auth/auth-screen";
import { SignUpForm } from "~/features/auth/signup-form";

export default function SignUpScreen() {
  return (
    <AuthScreen
      title="Create your account"
      description="Save your likes and playlists, and pick them up on any device."
    >
      <SignUpForm />
    </AuthScreen>
  );
}
