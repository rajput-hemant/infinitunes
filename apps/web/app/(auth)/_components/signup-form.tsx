"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@infinitunes/auth/client";
import { signUpSchema } from "@infinitunes/auth/schemas";
import { Button } from "@infinitunes/ui/components/button";
import { Loader2, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";

import { controlStyles } from "~/lib/control-styles";
import { userMessage } from "~/lib/user-message";
import { asRoute, cn, safeRedirectPath } from "~/lib/utils";

import { EmailField } from "./email-field";
import { OAuthButtons } from "./oauth-buttons";
import { PasswordField } from "./password-field";

type SignUpFormData = z.infer<typeof signUpSchema>;

const defaultValues: SignUpFormData = {
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignUpForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const searchParams = useSearchParams();
  const callbackUrl = safeRedirectPath(
    searchParams.get("callbackUrl") || searchParams.get("redirect"),
  );
  const authError = searchParams.get("error");

  React.useEffect(() => {
    if (authError === "OAuthAccountNotLinked") {
      toast.error("OAuth Account Not Linked", {
        description: "This account is already linked with another provider.",
      });
    }
  }, [authError]);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues,
  });

  async function onSubmit(formData: SignUpFormData) {
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.email.split("@")[0],
      });

      if (error) {
        toast.error(
          error.status < 500 ? userMessage(error.message) : userMessage(null),
        );
      } else {
        toast.success("Account Created Successfully");
        router.push(asRoute(callbackUrl));
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error(userMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="order-2 flex flex-col gap-3"
      >
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
          disabled={isSubmitting}
          className={cn(controlStyles.text, "w-full")}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Mail className="mr-2 size-4" />
          )}
          Sign Up
        </Button>
      </form>

      <div className="order-1">
        <OAuthButtons
          isFormDisabled={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      </div>
    </div>
  );
}
