"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { emailSchema, passwordSchema } from "@infinitunes/auth/schemas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@infinitunes/ui/components/alert-dialog";
import { Button, buttonVariants } from "@infinitunes/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@infinitunes/ui/components/field";
import { Input } from "@infinitunes/ui/components/input";
import { Separator } from "@infinitunes/ui/components/separator";
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
import { changePassword, deleteUser, updateUser } from "~/lib/actions";
import { userMessage } from "~/lib/user-message";

type ProfileFormProps = React.ComponentProps<"div"> & {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

const profileSchema = z.object({
  name: z.string().min(1, "Name is Required"),
  email: emailSchema,
  currentPassword: z.string().optional(),
  password: passwordSchema.or(z.literal("")).optional(),
});

type FormData = z.infer<typeof profileSchema>;

export function ProfileForm({ user }: ProfileFormProps) {
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState("");
  const [deletePassword, setDeletePassword] = React.useState("");

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
      await updateUser({
        name: formData.name,
        ...(emailChanged && {
          email: formData.email,
          currentPassword: formData.currentPassword,
        }),
      });
      if (newPassword && formData.currentPassword) {
        await changePassword({
          password: formData.currentPassword,
          newPassword,
        });
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

  async function deleteUserHandler() {
    toast.promise(deleteUser(deletePassword || undefined), {
      loading: "Deleting Account...",
      success: "Account Deleted! Logging out...",
      error: userMessage,
    });
  }

  return (
    <div className="flex w-full max-w-5xl flex-col-reverse gap-6 px-6 py-2 md:flex-row md:justify-between md:gap-4">
      <div className="min-w-0 flex-1 space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field id="edit-profile" data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor={ids.name}>Name</FieldLabel>
                <div className="relative">
                  <Input
                    id={ids.name}
                    type="text"
                    aria-invalid={!!fieldState.error}
                    disabled={isSubmitting}
                    placeholder={user.name ?? "John Doe"}
                    className="w-full max-w-96 shadow-xs"
                    {...field}
                  />
                </div>
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
                <div className="relative flex gap-4">
                  <Input
                    id={ids.email}
                    type="email"
                    aria-invalid={!!fieldState.error}
                    disabled={isSubmitting}
                    placeholder={user.email ?? "you@example.com"}
                    className="w-full max-w-96 shadow-xs"
                    {...field}
                  />
                </div>
                <FieldDescription>
                  Your email will be used for account notifications.
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

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
                  className="w-full max-w-96 shadow-xs"
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
              <Field id="change-password" data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor={ids.password}>New Password</FieldLabel>
                <div className="relative w-full max-w-96">
                  <Input
                    id={ids.password}
                    type={isPassVisible ? "text" : "password"}
                    aria-invalid={!!fieldState.error}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    placeholder="••••••••••"
                    className="pr-8 shadow-xs"
                    {...field}
                  />
                  <Tooltip>
                    <TooltipTrigger
                      delay={150}
                      aria-label={
                        isPassVisible ? "Hide Password" : "Show Password"
                      }
                      tabIndex={-1}
                      type="button"
                      disabled={!field.value}
                      onClick={() => setIsPassVisible(!isPassVisible)}
                      className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isPassVisible ? (
                        <EyeOff aria-hidden className="size-5" />
                      ) : (
                        <Eye aria-hidden className="size-5" />
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

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="shadow-xs">
              Save Changes
            </Button>
          </div>
        </form>

        <div id="delete-account" className="space-y-4">
          <h2 className="font-heading text-lg text-destructive drop-shadow-md sm:text-xl md:text-2xl">
            Danger Zone
          </h2>
          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium">Delete your account</p>
              <small>Delete your account and all its associated data.</small>
            </div>

            <AlertDialog
              onOpenChange={(open) => {
                // Do not keep the typed password around after the dialog closes.
                if (!open) {
                  setDeletePassword("");
                  setConfirmDelete("");
                }
              }}
            >
              <AlertDialogTrigger
                render={<Button variant="destructive">Delete Account</Button>}
              />

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to delete your account?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Once you delete your account, there is no going back. Please
                    be certain. Accounts without a password (passkey or OAuth)
                    can leave the password blank if they signed in within the
                    last 10 minutes; otherwise sign in again first.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <Input
                  type="password"
                  autoComplete="current-password"
                  aria-label="Your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password (if you have one)"
                />
                <Input
                  type="text"
                  autoComplete="off"
                  aria-label="Type DELETE MY ACCOUNT to confirm"
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  placeholder="Type DELETE MY ACCOUNT to confirm!"
                />

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteUserHandler}
                    disabled={confirmDelete !== "DELETE MY ACCOUNT"}
                    className={buttonVariants({ variant: "destructive" })}
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="relative size-40 shrink-0 self-center overflow-hidden md:size-52 md:self-start">
        <Image
          src={user.image ?? "/images/placeholder/user.jpg"}
          alt={user.name ?? "Profile Photo"}
          fill
          className="rounded-full border p-1 shadow-xs"
        />
      </div>
    </div>
  );
}
