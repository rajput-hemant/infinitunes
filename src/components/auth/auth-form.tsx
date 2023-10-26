"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { createNewAccount } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { authSchema } from "@/lib/validations";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ToastAction } from "../ui/toast";
import { Small } from "../ui/topography";
import { toast } from "../ui/use-toast";
import OAuthButtons from "./oauth-buttons";

type Props = {
  isLoginPage?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const loginSchema = authSchema.innerType().omit({ confirmPassword: true });

type FormData = z.infer<typeof authSchema>;

export function AuthForm({ isLoginPage, className, ...props }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(isLoginPage ? loginSchema : authSchema),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const processForm: SubmitHandler<FormData> = async ({ email, password }) => {
    setIsSubmitting(true);

    try {
      if (isLoginPage) {
        await signIn("credentials", { email, password });
      } else {
        await createNewAccount({ email, password });
      }
    } catch (error) {
      console.error(error);

      let description = "Please try again later.";

      if ((error as Error).message.includes("user_email_unique")) {
        description = "An account with this email already exists.";
      }

      toast({
        variant: "destructive",
        title: "Uh oh!, Something went wrong",
        description,
        action: <ToastAction altText="Try Again">Try Again</ToastAction>,
        duration: 1000,
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className={cn("space-y-6", className)} {...props}>
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
              {isLoginPage ? "Signing In" : "Creating Account"}
            </>
          ) : (
            `Sign ${isLoginPage ? "In" : "Up"}`
          )}
        </Button>
      </form>

      <div className="relative">
        <span className="absolute inset-x-0 inset-y-1/2 border-t" />

        <span className="bg-background text-muted-foreground relative mx-auto flex w-fit px-2 text-xs uppercase">
          Or continue with
        </span>
      </div>

      <OAuthButtons className="flex flex-col space-y-2" />
    </div>
  );
}
