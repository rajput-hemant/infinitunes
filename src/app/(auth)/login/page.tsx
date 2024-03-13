import { LoginForm } from "../_components/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl drop-shadow-md sm:text-4xl md:text-5xl dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent">
        Login
      </h1>

      <p className="text-muted-foreground text-sm">
        Enter your credentials below to login
      </p>

      <LoginForm />
    </div>
  );
}
