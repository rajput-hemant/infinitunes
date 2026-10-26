"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@infinitunes/auth/schemas";
import { userMessage } from "@infinitunes/core/user-message";
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
import type { z } from "zod";

import { useIsTyping } from "~/hooks/use-store";
import { unwrap } from "~/lib/action-result";
import { changePassword, updateUser } from "~/lib/actions";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { SettingsCard } from "./settings-card";
import { SettingsBlock } from "./settings-row";

type ProfileFormProps = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

const inputClass = cn(controlStyles.textLg, controlStyles.flatInput);
const labelClass = "text-[0.8125rem] leading-5 font-semibold";
const primaryButtonClass = cn(
  controlStyles.text,
  "rounded-sm px-3 font-semibold",
);

type FormData = z.infer<typeof profileSchema>;

export function ProfileForm({ user }: ProfileFormProps) {
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [, setIsTyping] = useIsTyping();
  const uid = React.useId();
  const ids = {
    name: `${uid}-name`,
    email: `${uid}-email`,
    currentPassword: `${uid}-current-password`,
    password: `${uid}-new-password`,
  };

  // The player's keyboard shortcuts pause while a field has focus, not for the whole page.
  const typingProps = {
    onFocus: () => setIsTyping(true),
    onBlur: () => setIsTyping(false),
  };

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

  async function onSubmitProfile(formData: FormData) {
    const emailChanged = formData.email !== user.email;

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
    }

    toast.promise(save(), {
      loading: "Updating Profile...",
      success: "Profile Updated!",
      error: userMessage,
      finally: () => setIsSubmitting(false),
    });
  }

  async function onSubmitPassword(formData: FormData) {
    if (!formData.password) {
      form.setError("password", { message: "Enter a new password" });
      return;
    }
    if (!formData.currentPassword) {
      form.setError("currentPassword", {
        message: "Enter your current password to change your password",
      });
      return;
    }
    const { currentPassword, password: newPassword } = formData;

    setIsSubmitting(true);

    async function save() {
      await unwrap(changePassword({ password: currentPassword, newPassword }));
      form.setValue("currentPassword", "");
      form.setValue("password", "");
    }

    toast.promise(save(), {
      loading: "Updating Password...",
      success: "Password Updated!",
      error: userMessage,
      finally: () => setIsSubmitting(false),
    });
  }

  // Two forms, one set of fields: each submit checks only its own inputs.
  async function submitProfile(event: React.FormEvent) {
    event.preventDefault();
    if (await form.trigger(["name", "email"])) {
      await onSubmitProfile(form.getValues());
    }
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    if (await form.trigger(["currentPassword", "password"])) {
      await onSubmitPassword(form.getValues());
    }
  }

  const initial = (user.name || user.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <SettingsCard title="Profile and password">
      <SettingsBlock keywords="edit profile name email avatar account">
        <form
          id="profile"
          onSubmit={submitProfile}
          aria-labelledby={`${uid}-profile-title`}
          className="grid scroll-mt-36 gap-4 lg:scroll-mt-20"
          {...typingProps}
        >
          <div className="space-y-0.5">
            <h4 id={`${uid}-profile-title`} className="text-sm/5 font-semibold">
              Profile
            </h4>
            <p className="text-xs/4 text-muted-foreground">
              This is how others will see you on the site.
            </p>
          </div>

          <div className="grid items-start gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-8">
            <div className="grid justify-items-center gap-3 md:w-32">
              <div
                aria-hidden
                className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-primary to-[color-mix(in_srgb,var(--primary)_40%,black)] text-[1.75rem] leading-none font-bold text-primary-foreground shadow-lg md:size-28 md:text-[2.5rem]"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor={ids.name} className={labelClass}>
                      Name
                    </FieldLabel>
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
                    <FieldLabel htmlFor={ids.email} className={labelClass}>
                      Email
                    </FieldLabel>
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
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClass}
            >
              Save profile
            </Button>
          </div>
        </form>
      </SettingsBlock>

      <SettingsBlock keywords="change password current new sign in security">
        <form
          id="password"
          onSubmit={submitPassword}
          aria-labelledby={`${uid}-password-title`}
          className="grid scroll-mt-36 gap-4 lg:scroll-mt-20"
          {...typingProps}
        >
          <div className="space-y-0.5">
            <h4
              id={`${uid}-password-title`}
              className="text-sm/5 font-semibold"
            >
              Password
            </h4>
            <p className="text-xs/4 text-muted-foreground">
              Update the password you use to sign in.
            </p>
          </div>

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="currentPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel
                    htmlFor={ids.currentPassword}
                    className={labelClass}
                  >
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
                    Required to change your password, and your email if you have
                    a password. Passkey or OAuth only accounts can leave it
                    blank if they signed in within the last 10 minutes.
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
                  <FieldLabel htmlFor={ids.password} className={labelClass}>
                    New Password
                  </FieldLabel>
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
                        onClick={() => setIsPassVisible((visible) => !visible)}
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
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClass}
            >
              Update password
            </Button>
          </div>
        </form>
      </SettingsBlock>
    </SettingsCard>
  );
}
