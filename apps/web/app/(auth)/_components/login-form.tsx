"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@infinitunes/auth/client";
import { Button } from "@infinitunes/ui/button";
import { Field, FieldError, FieldLabel } from "@infinitunes/ui/field";
import { Input } from "@infinitunes/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/tooltip";
import { AtSign, Eye, EyeOff, Fingerprint, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";

import { loginSchema } from "@/lib/validations";

import { OAuthButtons } from "./oauth-buttons";

type FormData = z.infer<typeof loginSchema>;

const defaultValues: FormData = {
  type: "email",
  email: "",
  password: "",
};

export function LoginForm() {
  const [isEmailMode, setIsEmailMode] = React.useState(true);
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  if (authError === "OAuthAccountNotLinked") {
    toast.error("OAuth Account Not Linked", {
      description: "This account is already linked with another provider.",
    });
  }

  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      if (formData.type === "email") {
        const { error } = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast.error(error.message ?? "Something went wrong.");
        } else {
          toast.success("You have been signed in.");
        }
      } else {
        const { error } = await authClient.signIn.username({
          username: formData.username!,
          password: formData.password,
        });

        if (error) {
          toast.error(error.message ?? "Something went wrong.");
        } else {
          toast.success("You have been signed in.");
        }
      }
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
      <Controller
        control={form.control}
        name={isEmailMode ? "email" : "username"}
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel className="sr-only">
              {isEmailMode ? "Email" : "Username"}
            </FieldLabel>
            <div className="relative">
              <Input
                type={isEmailMode ? "email" : "text"}
                disabled={isSubmitting}
                placeholder={isEmailMode ? "you@domain.com" : "@username"}
                className="pr-8 shadow-xs"
                {...field}
              />
              <Tooltip>
                <TooltipTrigger
                  delay={150}
                  aria-label={
                    isEmailMode ? "Use Username instead" : "Use Email instead"
                  }
                  tabIndex={-1}
                  type="button"
                  onClick={() => setIsEmailMode(!isEmailMode)}
                  className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  {isEmailMode ? (
                    <AtSign className="size-5" />
                  ) : (
                    <Mail className="size-5" />
                  )}
                </TooltipTrigger>

                <TooltipContent>
                  <p className="text-xs">
                    {isEmailMode ? "Use Username instead" : "Use Email instead"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel className="sr-only">Password</FieldLabel>
            <div className="relative">
              <Input
                type={isPassVisible ? "text" : "password"}
                disabled={isSubmitting}
                placeholder="••••••••••"
                className="pr-8 shadow-xs"
                {...field}
              />
              <Tooltip>
                <TooltipTrigger
                  delay={150}
                  aria-label={isPassVisible ? "Hide Password" : "Show Password"}
                  tabIndex={-1}
                  type="button"
                  disabled={!field.value}
                  onClick={() => setIsPassVisible(!isPassVisible)}
                  className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  {isPassVisible ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </TooltipTrigger>

                <TooltipContent>
                  <p className="text-xs">
                    {isPassVisible ? "Hide Password" : "Show Password"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Button
        type="submit"
        size="sm"
        disabled={isSubmitting}
        className="w-full font-semibold shadow-md"
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : isEmailMode ? (
          <Mail className="mr-2 size-4" />
        ) : (
          <Fingerprint className="mr-2 size-4" />
        )}

        {isEmailMode ? "Login with Email" : "Login"}
      </Button>

      <p className="mx-auto mt-2 text-xs text-muted-foreground hover:text-foreground">
        <Link
          href="/reset-password"
          className="underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-hidden"
        >
          Forgot password?
        </Link>
      </p>

      <OAuthButtons
        isFormDisabled={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </form>
  );
}
