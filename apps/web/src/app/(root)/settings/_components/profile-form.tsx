"use client";

import React from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Pen } from "lucide-react";
import { signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { User } from "next-auth";

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
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsTyping } from "@/hooks/use-store";
import { deleteUser, updateUser } from "@/lib/actions";
import { currentlyInDev } from "@/lib/utils";
import { emailSchema, passwordSchema, usernameSchema } from "@/lib/validations";

type ProfileFormProps = React.ComponentProps<"div"> & {
  user: User;
};

const profileSchema = z.object({
  name: z.string().min(1, "Name is Required"),
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema.optional(),
});

type FormData = z.infer<typeof profileSchema>;

export function ProfileForm({ user }: ProfileFormProps) {
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState("");

  const [_, setIsTyping] = useIsTyping();

  React.useEffect(() => {
    setIsTyping(true);
    return () => setIsTyping(false);
  }, [setIsTyping]);

  const defaultValues: FormData = {
    name: user.name ?? "",
    username: user.username ?? "",
    email: user.email ?? "",
  };

  const form = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    toast.promise(updateUser({ id: user.id!, ...formData }), {
      loading: "Updating Profile...",
      success: "Profile Updated!",
      error: (e) => e.message,
      finally: () => setIsSubmitting(false),
    });
  }

  async function deleteUserHandler() {
    toast.promise(deleteUser(user.id!), {
      loading: "Deleting Account...",
      success: "Account Deleted! Logging out...",
      error: (e) => e.message,
    });

    toast.promise(signOut(), {
      loading: "Logging you out...",
      success: "You have been logged out.",
    });
  }

  return (
    <div className="flex w-full max-w-5xl justify-between gap-4 px-6 py-2">
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem id="edit-profile">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={isSubmitting}
                      placeholder={user.name ?? "John Doe"}
                      className="w-96 shadow-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your name will be displayed on the site.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={isSubmitting}
                      placeholder={user.name ?? "@johndoe"}
                      className="w-96 shadow-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your username will be used in your profile URL.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <Input
                        type="email"
                        disabled={isSubmitting}
                        placeholder={user.email ?? "you@example.com"}
                        className="w-96 shadow-sm"
                        {...field}
                      />
                      <Button type="button" onClick={currentlyInDev}>
                        Verify Email
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your email will be used for account notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem id="change-password">
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative w-96">
                      <Input
                        type={isPassVisible ? "text" : "password"}
                        disabled={isSubmitting}
                        placeholder="••••••••••"
                        className="pr-8 shadow-sm"
                        {...field}
                      />
                      <Tooltip delayDuration={150}>
                        <TooltipTrigger
                          aria-label={
                            isPassVisible ? "Hide Password" : "Show Password"
                          }
                          tabIndex={-1}
                          type="button"
                          disabled={!field.value}
                          onClick={() => setIsPassVisible(!isPassVisible)}
                          className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                        >
                          {isPassVisible ?
                            <EyeOff className="size-5" />
                          : <Eye className="size-5" />}
                        </TooltipTrigger>

                        <TooltipContent>
                          <p className="text-xs">
                            {isPassVisible ? "Hide Password" : "Show Password"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter your new password to change your password.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="shadow-sm"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Form>

        <div id="delete-account" className="space-y-4">
          <p className="text-3xl font-bold text-destructive drop-shadow">
            Danger Zone
          </p>
          <Separator />

          <div className="flex justify-between">
            <div>
              <p className="font-medium">Delete your account</p>
              <small>Delete your account and all its associated data.</small>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to delete your account?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <Input
                  type="text"
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

      <div className="relative size-52 overflow-hidden">
        <Image
          src={user.image ?? "/images/placeholder/user.jpg"}
          alt={user.name ?? "Profile Photo"}
          fill
          className="rounded-full border p-1 shadow-sm"
        />

        <Button
          size="sm"
          variant="outline"
          onClick={currentlyInDev}
          className="absolute bottom-4 left-0 gap-2 shadow-sm"
        >
          <Pen size={14} /> Edit
        </Button>
      </div>
    </div>
  );
}
