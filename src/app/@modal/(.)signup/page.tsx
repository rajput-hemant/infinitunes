import { AuthForm } from "@/components/auth/auth-form";
import AuthModal from "../auth-modal";

const LoginModal = () => {
  return (
    <AuthModal>
      <AuthForm isSignUpPage />
    </AuthModal>
  );
};

export default LoginModal;
