import { ForgotPasswordForm } from "~/app/(auth)/_components/forgot-password-form";

import { AuthModal } from "../auth-modal";

export const metadata = {
  title: "Forgot Password",
  description: "Request a link to reset your password",
};

export default function ForgotPasswordModal() {
  return (
    <AuthModal
      title="Forgot Password"
      description="Enter your email and we will send you a reset link"
    >
      <ForgotPasswordForm />
    </AuthModal>
  );
}
