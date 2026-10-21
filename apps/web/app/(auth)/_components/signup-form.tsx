"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@infinitunes/auth/client";
import { PASSWORD_HINT, signUpSchema } from "@infinitunes/auth/schemas";
import { userMessage } from "@infinitunes/core/user-message";
import { Button } from "@infinitunes/ui/components/button";
import { Loader2, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";

import { asRoute, safeRedirectPath } from "~/lib/utils";

import { EmailField } from "./email-field";
import { authPrimaryButtonStyles } from "./field-styles";
import { OAuthButtons } from "./oauth-buttons";
import { PasswordField } from "./password-field";

type SignUpFormData = z.infer<typeof signUpSchema>;

const defaultValues: SignUpFormData = {
  email: "",
  password: "",
  confirmPassword: "",
};

type AppRouter = ReturnType<typeof useRouter>;

/** Creates the account. Outside the component: the React Compiler bails out on try/finally. */
async function signUp(
  formData: SignUpFormData,
  {
    router,
    callbackUrl,
    setBusy,
  }: {
    router: AppRouter;
    callbackUrl: string;
    setBusy: (busy: boolean) => void;
  },
) {
  setBusy(true);

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
    setBusy(false);
  }
}

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
    await signUp(formData, {
      router,
      callbackUrl,
      setBusy: setIsSubmitting,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="order-2 grid gap-4"
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
              description={PASSWORD_HINT}
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
          className={authPrimaryButtonStyles}
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
          callbackUrl={callbackUrl}
          setIsSubmitting={setIsSubmitting}
        />
      </div>
    </div>
  );
}
