"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Eye, EyeOff, Fingerprint, Loader2, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
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
import { loginSchema } from "@/lib/validations";
import { OAuthButtons } from "./oauth-buttons";

type FormData = z.infer<typeof loginSchema>;

const defaultValues: FormData = {
  type: "email",
  email: "",
  password: "",
};

export function LoginForm() {
  const [isEmailMode, setIsEmailMode] = React.useState(true);
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  if (authError === "OAuthAccountNotLinked") {
    toast.error("OAuth Account Not Linked", {
      description: "This account is already linked with another provider.",
    });
  }

  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      toast.promise(signIn("credentials", { ...formData }), {
        loading: "Signing in...",
        success: "You have been signed in.",
        error: "Something went wrong.",
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
          name={isEmailMode ? "email" : "username"}
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="sr-only">
                {isEmailMode ? "Email" : "Username"}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={isEmailMode ? "email" : "text"}
                    disabled={isSubmitting}
                    placeholder={isEmailMode ? "you@domain.com" : "@username"}
                    className="pr-8 shadow-sm"
                    {...field}
                  />
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger
                      aria-label={
                        isEmailMode ?
                          "Use Username instead"
                        : "Use Email instead"
                      }
                      tabIndex={-1}
                      type="button"
                      onClick={() => setIsEmailMode(!isEmailMode)}
                      className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isEmailMode ?
                        <AtSign className="size-5" />
                      : <Mail className="size-5" />}
                    </TooltipTrigger>

                    <TooltipContent>
                      <p className="text-xs">
                        {isEmailMode ?
                          "Use Username instead"
                        : "Use Email instead"}
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

        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="w-full font-semibold shadow-md"
        >
          {isSubmitting ?
            <Loader2 className="mr-2 size-4 animate-spin" />
          : isEmailMode ?
            <Mail className="mr-2 size-4" />
          : <Fingerprint className="mr-2 size-4" />}

          {isEmailMode ? "Login with Email" : "Login"}
        </Button>
      </form>

      <p className="mx-auto mt-2 text-xs text-muted-foreground hover:text-foreground">
        <Link
          href="/reset-password"
          className="underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
        >
          Forgot password?
        </Link>
      </p>

      <OAuthButtons
        isFormDisabled={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </Form>
  );
}
