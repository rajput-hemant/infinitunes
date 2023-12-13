"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { createNewAccount, resetPassword } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { authSchema } from "@/lib/validations";
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ToastAction } from "../ui/toast";
import { H3, Muted, Small } from "../ui/topography";
import { toast } from "../ui/use-toast";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  isLoginPage?: boolean;
  isSignUpPage?: boolean;
};

const loginSchema = authSchema.innerType().omit({ confirmPassword: true });

type FormData = z.infer<typeof authSchema>;

export function AuthForm({
  isLoginPage,
  isSignUpPage,
  className,
  ...props
}: Props) {
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(isLoginPage ? loginSchema : authSchema),
  });

  const processForm: SubmitHandler<FormData> = async ({ email, password }) => {
    try {
      if (isLoginPage) {
        await signIn("credentials", { email, password });
      } else if (isSignUpPage) {
        await createNewAccount({ email, password });
      } else {
        await resetPassword({ email, password });
      }
    } catch (error) {
      const err = error as Error;
      console.error(err.message);

      let description = err.message || "Please try again later.";

      if (err.message.includes("user_email_unique")) {
        description = "An account with this email already exists.";
      }

      toast({
        variant: "destructive",
        title: "Uh oh!, Something went wrong",
        description,
        action: <ToastAction altText="Close">Close</ToastAction>,
      });
    }
  };

  let heading = "";
  let subheading = "";
  let submitButtonText = "";
  let submitButtonLoadingText = "";

  if (isLoginPage) {
    heading = "Login";
    subheading = "Enter your email below to login";
    submitButtonText = "Sign In";
    submitButtonLoadingText = "Signing In";
  } else if (isSignUpPage) {
    heading = "Create an account";
    subheading = "Enter your email below to create your account";
    submitButtonText = "Sign Up";
    submitButtonLoadingText = "Signing Up";
  } else {
    heading = "Reset Password";
    subheading = "Enter a new password below to reset your password";
    submitButtonText = "Change Password";
    submitButtonLoadingText = "Changing Password";
  }

  function toastNotifier(mode: "welcome" | "error" = "welcome") {
    if (mode === "welcome") {
      toast({
        title: "Welcome!",
        description: "You've successfully signed in.",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }

  async function googleSignInHandler() {
    setIsGoogleLoading(true);

    try {
      await signIn("google");
      toastNotifier();
    } catch (error) {
      toastNotifier("error");
    }

    setIsGoogleLoading(false);
  }

  async function githubSignInHandler() {
    setIsGithubLoading(true);

    try {
      await signIn("github");
      toastNotifier();
    } catch (error) {
      toastNotifier("error");
    }

    setIsGithubLoading(false);
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex flex-col space-y-2 py-2 text-center">
        <H3 className="text-2xl font-semibold tracking-tight">{heading}</H3>

        <p className="text-muted-foreground text-sm">{subheading}</p>
      </div>

      <form className="space-y-2" onSubmit={handleSubmit(processForm)}>
        <Label className="sr-only" htmlFor="email">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Email Address"
          disabled={isSubmitting}
          className={errors.email && "!ring-destructive"}
          {...register("email")}
        />
        <Small className="text-destructive mt-1">{errors.email?.message}</Small>

        <Label className="sr-only" htmlFor="password">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Password"
          disabled={isSubmitting}
          className={errors.password && "!ring-destructive"}
          {...register("password")}
        />
        <Small className="text-destructive mt-1">
          {errors.password?.message}
        </Small>

        {!isLoginPage && (
          <>
            <Label className="sr-only" htmlFor="confirmPassword">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              disabled={isSubmitting}
              className={errors.confirmPassword && "!ring-destructive"}
              {...register("confirmPassword")}
            />
            <Small className="text-destructive mt-1">
              {errors.confirmPassword?.message}
            </Small>
          </>
        )}

        <Button disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {submitButtonLoadingText}
            </>
          ) : (
            submitButtonText
          )}
        </Button>

        {isLoginPage && (
          <Muted className="hover:text-secondary-foreground mx-auto w-fit underline-offset-4 hover:underline">
            <Link href="/reset-password">Forgot Password?</Link>
          </Muted>
        )}
      </form>

      <div className="relative">
        <span className="absolute inset-x-0 inset-y-1/2 border-t" />

        <span className="bg-background text-muted-foreground relative mx-auto flex w-fit px-2 text-xs uppercase">
          Or continue with
        </span>
      </div>

      <div className="flex flex-col space-y-2">
        <Button
          type="button"
          variant="outline"
          disabled={isGoogleLoading}
          onClick={googleSignInHandler}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.Google className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isGithubLoading}
          onClick={githubSignInHandler}
        >
          {isGithubLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.GitHub className="mr-2 h-4 w-4" />
          )}
          Github
        </Button>
      </div>
    </div>
  );
}
