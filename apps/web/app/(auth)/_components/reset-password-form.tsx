"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@infinitunes/auth/client";
import { resetPasswordSchema } from "@infinitunes/auth/schemas";
import { Button, buttonVariants } from "@infinitunes/ui/components/button";
import { Key, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { PasswordField } from "./password-field";

type FormData = z.infer<typeof resetPasswordSchema>;

const defaultValues: FormData = { password: "", confirmPassword: "" };

function InvalidLink() {
  return (
    <div role="alert" className="mt-4 space-y-3 text-sm">
      <p className="text-muted-foreground">
        This reset link is invalid or has expired. Links work once and last for
        1 hour.
      </p>
      <Link
        href="/forgot-password"
        className={cn(buttonVariants(), controlStyles.text, "w-full")}
      >
        Request a new link
      </Link>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTokenRejected, setIsTokenRejected] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues,
  });

  if (!token || linkError || isTokenRejected) return <InvalidLink />;

  async function onSubmit(formData: FormData) {
    if (!token) return;
    setIsSubmitting(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: formData.password,
        token,
      });

      if (error?.status === 429) {
        toast.error("Too many attempts. Please wait a minute and try again.");
      } else if (error?.code === "INVALID_TOKEN") {
        setIsTokenRejected(true);
      } else if (error) {
        toast.error(error.message ?? "Something went wrong.");
      } else {
        toast.success("Password reset. Please sign in with your new password.");
        router.push("/login");
      }
    } catch (error) {
      console.error((error as Error).message);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
      <Controller
        control={form.control}
        name="password"
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

      <Controller
        control={form.control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <PasswordField
            field={field}
            fieldState={fieldState}
            label="Confirm new password"
            autoComplete="new-password"
            disabled={isSubmitting}
          />
        )}
      />

      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn(controlStyles.text, "w-full")}
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Key className="mr-2 size-4" />
        )}
        Reset Password
      </Button>
    </form>
  );
}
