import { LoginForm } from "../_components/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-heading text-3xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-4xl md:text-5xl">
        Login
      </h1>

      <p className="text-sm text-muted-foreground">
        Enter your credentials below to login
      </p>

      <LoginForm />
    </div>
  );
}
