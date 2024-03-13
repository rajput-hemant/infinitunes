import { SignUpForm } from "../_components/signup-form";

export const metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

export default function SignUpPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl drop-shadow-md sm:text-4xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent">
        Create an Account
      </h1>

      <p className="text-muted-foreground text-sm">
        Enter your details to create your account.
      </p>

      <SignUpForm />
    </div>
  );
}
