"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@infinitunes/auth/schemas";
import { Button } from "@infinitunes/ui/components/button";
import { Key, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";

import { resetPasswordAnonymous } from "~/lib/actions";
import { userMessage } from "~/lib/user-message";

import { EmailField } from "./email-field";
import { OAuthButtons } from "./oauth-buttons";
import { PasswordField } from "./password-field";

type FormData = z.infer<typeof resetPasswordSchema>;

const defaultValues: FormData = {
  email: "",
  password: "",
  newPassword: "",
};

export function ResetPasswordForm() {
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
    resolver: zodResolver(resetPasswordSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      toast.promise(resetPasswordAnonymous({ ...formData }), {
        loading: "Resetting Password...",
        success: "Password Reset Successfully",
        error: userMessage,
        finally: () => setIsSubmitting(false),
      });
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
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
              label="Current password"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          )}
        />

        <Controller
          control={form.control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <PasswordField
              field={field}
              fieldState={fieldState}
              label="New password"
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
            <Key className="mr-2 size-4" />
          )}
          Reset Password
        </Button>
      </form>

      <OAuthButtons
        isFormDisabled={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </>
  );
}
