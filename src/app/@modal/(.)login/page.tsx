import { LoginForm } from "@/app/(auth)/_components/login-form";
import { AuthModal } from "../auth-modal";

export const metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginModal() {
  return (
    <AuthModal
      title="Login"
      description="Enter your credentials below to login"
    >
      <LoginForm />
    </AuthModal>
  );
}
