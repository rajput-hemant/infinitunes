"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
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
import { createNewAccount } from "@/lib/actions";
import { signUpSchema } from "@/lib/validations";
import { OAuthButtons } from "./oauth-buttons";

type FormData = z.infer<typeof signUpSchema>;

const defaultValues: FormData = {
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignUpForm() {
  const [isPassVisible, setIsPassVisible] = React.useState(false);
  const [isConfirmPassVisible, setIsConfirmPassVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  if (authError === "OAuthAccountNotLinked") {
    toast.error("OAuth Account Not Linked", {
      description: "This account is already linked with another provider.",
    });
  }

  const form = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues,
  });

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);

    try {
      toast.promise(createNewAccount({ ...formData }), {
        loading: "Creating Account...",
        success: "Account Created Successfully",
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
          name="confirmPassword"
          control={form.control}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="sr-only">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={isConfirmPassVisible ? "text" : "password"}
                    disabled={isSubmitting}
                    placeholder="••••••••••"
                    className="pr-8 shadow-sm"
                    {...field}
                  />
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger
                      aria-label={
                        isConfirmPassVisible ? "Hide Password" : "Show Password"
                      }
                      tabIndex={-1}
                      type="button"
                      disabled={!field.value}
                      onClick={() =>
                        setIsConfirmPassVisible(!isConfirmPassVisible)
                      }
                      className="absolute inset-y-0 right-2 my-auto text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isConfirmPassVisible ?
                        <EyeOff className="size-5" />
                      : <Eye className="size-5" />}
                    </TooltipTrigger>

                    <TooltipContent>
                      <p className="text-xs">
                        {isConfirmPassVisible ?
                          "Hide Password"
                        : "Show Password"}
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
          : <Mail className="mr-2 size-4" />}
          Sign Up
        </Button>
      </form>

      <OAuthButtons
        isFormDisabled={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </Form>
  );
}
