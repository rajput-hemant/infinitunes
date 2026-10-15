import { ForgotPasswordForm } from "~/app/(auth)/_components/forgot-password-form";
import { noindexMetadata } from "~/lib/metadata";

import { AuthModal } from "../auth-modal";

export const metadata = {
  ...noindexMetadata,
  title: "Forgot Password",
  description: "Request a link to reset your password",
};

export default function ForgotPasswordModal() {
  return (
    <AuthModal
      title="Forgot password"
      description="We will email you a link to reset it."
    >
      <ForgotPasswordForm />
    </AuthModal>
  );
}
