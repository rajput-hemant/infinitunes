import { ResetPasswordForm } from "~/app/(auth)/_components/reset-password-form";
import { noindexMetadata } from "~/lib/metadata";

import { AuthModal } from "../auth-modal";

export const metadata = {
  ...noindexMetadata,
  title: "Reset Password",
  description: "Choose a new password",
};

export default function ResetPasswordModal() {
  return (
    <AuthModal
      title="Reset password"
      description="Choose a new password for your account."
    >
      <ResetPasswordForm />
    </AuthModal>
  );
}
