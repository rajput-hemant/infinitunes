import { SignUpForm } from "@/app/(auth)/_components/signup-form";
import { AuthModal } from "../auth-modal";

export const metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

export default function SignUpModal() {
  return (
    <AuthModal
      title="Create Account"
      description="Enter your details below to create an account"
    >
      <SignUpForm />
    </AuthModal>
  );
}
