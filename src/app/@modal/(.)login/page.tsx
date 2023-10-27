import { AuthForm } from "@/components/auth/auth-form";
import AuthModal from "../auth-modal";

const SignUpModal = () => {
  return (
    <AuthModal>
      <AuthForm isLoginPage />
    </AuthModal>
  );
};

export default SignUpModal;
