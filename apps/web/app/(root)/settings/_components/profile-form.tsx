"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { emailSchema, passwordSchema } from "@infinitunes/auth/schemas";
import { Button } from "@infinitunes/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@infinitunes/ui/components/field";
import { Input } from "@infinitunes/ui/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useIsTyping } from "~/hooks/use-store";
import { unwrap } from "~/lib/action-result";
import { changePassword, updateUser } from "~/lib/actions";
import { controlStyles } from "~/lib/control-styles";
import { userMessage } from "~/lib/user-message";
import { cn } from "~/lib/utils";
import { nameSchema } from "~/lib/validations";

import { SettingsSection } from "./settings-section";

type ProfileFormProps = React.ComponentProps<"div"> & {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  currentPassword: z.string().optional(),
  password: passwordSchema.or(z.literal("")).optional(),
});

type FormData = z.infer<typeof profileSchema>;

export function ProfileForm({ user }: ProfileFormProps) {
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [_, setIsTyping] = useIsTyping();
  const uid = React.useId();
  const ids = {
    name: `${uid}-name`,
    email: `${uid}-email`,
    currentPassword: `${uid}-current-password`,
    password: `${uid}-new-password`,
  };

  React.useEffect(() => {
    setIsTyping(true);
    return () => setIsTyping(false);
  }, [setIsTyping]);

  const defaultValues: FormData = {
    name: user.name ?? "",
    email: user.email ?? "",
    currentPassword: "",
    password: "",
  };

  const form = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
    const emailChanged = formData.email !== user.email;
    const newPassword = formData.password;

    if (newPassword && !formData.currentPassword) {
      form.setError("currentPassword", {
        message: "Enter your current password to change your password",
      });
      return;
    }

    setIsSubmitting(true);

    async function save() {
      await unwrap(
        updateUser({
          name: formData.name,
          ...(emailChanged && {
            email: formData.email,
            currentPassword: formData.currentPassword,
          }),
        }),
      );
      if (newPassword && formData.currentPassword) {
        await unwrap(
          changePassword({
            password: formData.currentPassword,
            newPassword,
          }),
        );
      }
      form.setValue("currentPassword", "");
      form.setValue("password", "");
    }

    toast.promise(save(), {
      loading: "Updating Profile...",
      success: "Profile Updated!",
      error: userMessage,
      finally: () => setIsSubmitting(false),
    });
  }

  const inputClass = cn(controlStyles.text, "w-full shadow-xs");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-10">
      <SettingsSection
        id="profile"
        title="Account Settings"
        description="This is how others will see you on the site."
      >
        <div className="grid items-start gap-8 md:grid-cols-[minmax(0,28rem)_auto]">
          <div className="grid gap-5">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor={ids.name}>Name</FieldLabel>
                  <Input
                    id={ids.name}
                    type="text"
                    aria-invalid={!!fieldState.error}
                    disabled={isSubmitting}
                    placeholder={user.name ?? "John Doe"}
                    className={inputClass}
                    {...field}
                  />
                  <FieldDescription>
                    Your name will be displayed on the site.
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor={ids.email}>Email</FieldLabel>
                  <Input
                    id={ids.email}
                    type="email"
                    aria-invalid={!!fieldState.error}
                    disabled={isSubmitting}
                    placeholder={user.email ?? "you@example.com"}
                    className={inputClass}
                    {...field}
                  />
                  <FieldDescription>
                    Your email will be used for account notifications.
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={controlStyles.textLg}
              >
                Save Changes
              </Button>
            </div>
          </div>

          <div className="relative size-20 shrink-0 order-first justify-self-center overflow-hidden sm:size-28 md:order-none">
            <Image
              src={user.image ?? "/images/placeholder/user.jpg"}
              alt={user.name ?? "Profile Photo"}
              fill
              className="rounded-full border p-1 shadow-xs"
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        id="password"
        title="Change Password"
        description="Update the password you use to sign in."
      >
        <div className="grid max-w-md gap-5">
          <Controller
            control={form.control}
            name="currentPassword"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor={ids.currentPassword}>
                  Current Password
                </FieldLabel>
                <Input
                  id={ids.currentPassword}
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!fieldState.error}
                  disabled={isSubmitting}
                  placeholder="••••••••••"
                  className={inputClass}
                  {...field}
                />
                <FieldDescription>
                  Required to change your password, and your email if you have a
                  password. Passkey or OAuth only accounts can leave it blank if
                  they signed in within the last 10 minutes.
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor={ids.password}>New Password</FieldLabel>
                <div className="relative w-full">
                  <Input
                    id={ids.password}
                    type={isPassVisible ? "text" : "password"}
                    aria-invalid={!!fieldState.error}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    placeholder="••••••••••"
                    className={cn(inputClass, "pr-12")}
                    {...field}
                  />
                  <Tooltip>
                    <TooltipTrigger
                      delay={150}
                      aria-label={
                        isPassVisible ? "Hide Password" : "Show Password"
                      }
                      type="button"
                      disabled={!field.value}
                      onClick={() => setIsPassVisible(!isPassVisible)}
                      className={cn(
                        controlStyles.rowIcon,
                        "absolute inset-y-0 right-0 my-auto flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      )}
                    >
                      {isPassVisible ? (
                        <EyeOff aria-hidden className="size-4" />
                      ) : (
                        <Eye aria-hidden className="size-4" />
                      )}
                    </TooltipTrigger>

                    <TooltipContent>
                      <p className="text-xs">
                        {isPassVisible ? "Hide Password" : "Show Password"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FieldDescription>
                  Enter your new password to change your password.
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={controlStyles.textLg}
            >
              Update Password
            </Button>
          </div>
        </div>
      </SettingsSection>
    </form>
  );
}
