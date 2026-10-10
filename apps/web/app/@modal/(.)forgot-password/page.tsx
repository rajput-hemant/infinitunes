import { ForgotPasswordForm } from "~/app/(auth)/_components/forgot-password-form";

import { AuthModal } from "../auth-modal";

export const metadata = {
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
