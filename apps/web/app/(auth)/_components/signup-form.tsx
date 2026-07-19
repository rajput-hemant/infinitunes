"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@infinitunes/auth/client";
import { Button } from "@infinitunes/ui/components/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@infinitunes/ui/components/field";
import { Input } from "@infinitunes/ui/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";

import { signUpSchema } from "@/lib/validations";

import { OAuthButtons } from "./oauth-buttons";

type FormData = z.infer<typeof signUpSchema>;

const defaultValues: FormData = {
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignUpForm() {
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isConfirmPassVisible, setIsConfirmPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  if (authError === "OAuthAccountNotLinked") {
    toast.error("OAuth Account Not Linked", {
      description: "This account is already linked with another provider.",
    });
  }

  const form = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.email.split("@")[0],
      });

      if (error) {
        toast.error(error.message ?? "Something went wrong.");
      } else {
        toast.success("Account Created Successfully");
      }
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel className="sr-only">Email</FieldLabel>
            <div className="relative">
              <Input
                type="email"
                disabled={isSubmitting}
                placeholder="you@domain.com"
                className="shadow-xs"
                {...field}
              />
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

      <Controller
        control={form.control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel className="sr-only">Confirm Password</FieldLabel>
            <div className="relative">
              <Input
                type={isConfirmPassVisible ? "text" : "password"}
                disabled={isSubmitting}
                placeholder="••••••••••"
                className="pr-8 shadow-xs"
                {...field}
              />
              <Tooltip>
                <TooltipTrigger
                  delay={150}
                  aria-label={
                    isConfirmPassVisible ? "Hide Password" : "Show Password"
                  }
                  tabIndex={-1}
                  type="button"
                  disabled={!field.value}
                  onClick={() => setIsConfirmPassVisible(!isConfirmPassVisible)}
                  className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  {isConfirmPassVisible ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </TooltipTrigger>

                <TooltipContent>
                  <p className="text-xs">
                    {isConfirmPassVisible ? "Hide Password" : "Show Password"}
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
        ) : (
          <Mail className="mr-2 size-4" />
        )}
        Sign Up
      </Button>

      <OAuthButtons
        isFormDisabled={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </form>
  );
}
