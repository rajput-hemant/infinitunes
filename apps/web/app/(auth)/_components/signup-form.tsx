"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@infinitunes/auth/client";
import { signUpSchema } from "@infinitunes/auth/schemas";
import { Button } from "@infinitunes/ui/components/button";
import { Loader2, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";

import { EmailField } from "./email-field";
import { OAuthButtons } from "./oauth-buttons";
import { PasswordField } from "./password-field";

type FormData = z.infer<typeof signUpSchema>;

const defaultValues: FormData = {
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignUpForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  React.useEffect(() => {
    if (authError === "OAuthAccountNotLinked") {
      toast.error("OAuth Account Not Linked", {
        description: "This account is already linked with another provider.",
      });
    }
  }, [authError]);

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
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <EmailField
              field={field}
              fieldState={fieldState}
              autoComplete="email"
              disabled={isSubmitting}
            />
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordField
              field={field}
              fieldState={fieldState}
              label="Password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          )}
        />

        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <PasswordField
              field={field}
              fieldState={fieldState}
              label="Confirm password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          )}
        />

        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="h-9 w-full font-semibold shadow-md"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Mail className="mr-2 size-4" />
          )}
          Sign Up
        </Button>
      </form>

      <OAuthButtons
        isFormDisabled={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </>
  );
}
