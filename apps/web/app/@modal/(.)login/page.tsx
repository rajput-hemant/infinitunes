import { LoginForm } from "~/app/(auth)/_components/login-form";

import { AuthModal } from "../auth-modal";

export const metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginModal() {
  return (
    <AuthModal
      title="Welcome back"
      description="Log in to sync your library across devices."
    >
      <LoginForm />
    </AuthModal>
  );
}
