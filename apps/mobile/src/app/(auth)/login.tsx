import { AuthScreen } from "~/features/auth/auth-screen";
import { LoginForm } from "~/features/auth/login-form";

export default function LoginScreen() {
  return (
    <AuthScreen
      title="Welcome back"
      description="Sign in to sync your library across devices."
    >
      <LoginForm />
    </AuthScreen>
  );
}
