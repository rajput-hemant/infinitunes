"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Key, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { resetPassword } from "@/lib/actions";
import { resetPasswordSchema } from "@/lib/validations";
import { OAuthButtons } from "./oauth-buttons";

type FormData = z.infer<typeof resetPasswordSchema>;

const defaultValues: FormData = {
  email: "",
  password: "",
  newPassword: "",
};

export function ResetPasswordForm() {
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isNewPassVisible, setIsNewPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  if (authError === "OAuthAccountNotLinked") {
    toast.error("OAuth Account Not Linked", {
      description: "This account is already linked with another provider.",
    });
  }

  const form = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      toast.promise(resetPassword({ ...formData }), {
        loading: "Resetting Password...",
        success: "Password Reset Successfully",
        error: (error) => error.message,
        finally: () => setIsSubmitting(false),
      });
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="sr-only">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="email"
                    disabled={isSubmitting}
                    placeholder="you@domain.com"
                    className="shadow-sm"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="sr-only">Password</FormLabel>
              <FormControl>
                <div className="relative">
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="newPassword"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="sr-only">New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={isNewPassVisible ? "text" : "password"}
                    disabled={isSubmitting}
                    placeholder="••••••••••"
                    className="pr-8 shadow-sm"
                    {...field}
                  />
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger
                      aria-label={
                        isNewPassVisible ? "Hide Password" : "Show Password"
                      }
                      tabIndex={-1}
                      type="button"
                      disabled={!field.value}
                      onClick={() => setIsNewPassVisible(!isNewPassVisible)}
                      className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isNewPassVisible ?
                        <EyeOff className="size-5" />
                      : <Eye className="size-5" />}
                    </TooltipTrigger>

                    <TooltipContent>
                      <p className="text-xs">
                        {isNewPassVisible ? "Hide Password" : "Show Password"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="w-full font-semibold shadow-md"
        >
          {isSubmitting ?
            <Loader2 className="mr-2 size-4 animate-spin" />
          : <Key className="mr-2 size-4" />}
          Reset Password
        </Button>
      </form>

      <OAuthButtons
        isFormDisabled={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </Form>
  );
}
