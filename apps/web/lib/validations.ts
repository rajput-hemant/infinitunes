import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
} from "@infinitunes/auth/constants";
import * as z from "zod";

export const usernameSchema = z
  .string()
  .min(1, "Username is Required")
  .regex(
    new RegExp(`^(?=.{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$)`),
    "Username must be 8-15 characters long.",
  )
  .regex(
    USERNAME_REGEX,
    "Username must be alphanumeric and can contain [_ . -]",
  );

export const emailSchema = z
  .string()
  .min(1, "Email is Required")
  .email("Please enter a valid email");

export const passwordSchema = z
  .string()
  .min(1, "Password is Required")
  .regex(/^(?!\s*$).+/, "Password must not contain Whitespaces.")
  .regex(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter.")
  .regex(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter.")
  .regex(/^(?=.*\d)/, "Password must contain at least one number.")
  .regex(
    /^(?=.*[~`!@#$%^&*()--+={}[\]|\\:;"'<>,.?/_₹])/,
    "Password must contain at least one special character.",
  )
  .min(8, "Password must be at least 8 characters long.");

export const loginSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("username"),
    username: usernameSchema,
    password: passwordSchema,
  }),
  z.object({
    type: z.literal("email"),
    email: emailSchema,
    password: passwordSchema,
  }),
]);

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  newPassword: passwordSchema,
});

export const newPlaylistSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(100, { message: "Name must be at most 100 characters long" }),
  description: z
    .string()
    .max(255, { message: "Description must be at most 255 characters long" })
    .optional(),
});
