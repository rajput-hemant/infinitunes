import { SignUpForm } from "~/app/(auth)/_components/signup-form";
import { noindexMetadata } from "~/lib/metadata";

import { AuthModal } from "../auth-modal";

export const metadata = {
  ...noindexMetadata,
  title: "Sign Up",
  description: "Create a new account",
};

export default function SignUpModal() {
  return (
    <AuthModal
      title="Create your account"
      description="Free forever. No credit card needed."
      footer="login"
    >
      <SignUpForm />
    </AuthModal>
  );
}
