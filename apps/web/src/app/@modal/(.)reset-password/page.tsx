import { ResetPasswordForm } from "@/app/(auth)/_components/reset-password-form";
import { AuthModal } from "../auth-modal";

export const metadata = {
  title: "Reset Password",
  description: "Reset your password",
};

export default function ResetPasswordModal() {
  return (
    <AuthModal
      title="Reset Password"
      description="Enter your email below to reset your password"
    >
      <ResetPasswordForm />
    </AuthModal>
  );
}
