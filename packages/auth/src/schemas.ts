import { USER_NAME_MAX } from "@infinitunes/types";
import * as z from "zod";

export const emailSchema = z
  .string()
  .min(1, "Email is Required")
  .pipe(z.email("Please enter a valid email"));

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

/** `passwordSchema` in one sentence, for the field's hint. */
export const PASSWORD_HINT =
  "At least 8 characters with upper and lower case, a number and a symbol.";

/** The account's display name. */
export const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "Name is Required" })
  .max(USER_NAME_MAX, {
    error: `Name must be at most ${USER_NAME_MAX} characters long`,
  });

/**
 * The profile form: name and email; `currentPassword` confirms an email
 * change, and an empty `password` leaves it unchanged.
 */
export const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  currentPassword: z.string().optional(),
  password: passwordSchema.or(z.literal("")).optional(),
});

/** Sign-in only checks presence: accounts made under older, weaker rules must still get in. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is Required"),
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    name: z
      .string()
      .trim()
      .max(USER_NAME_MAX, {
        error: `Name must be at most ${USER_NAME_MAX} characters long`,
      })
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** Signed-in change: the account comes from the session, not the input. */
export const changePasswordSchema = z.object({
  password: passwordSchema,
  newPassword: passwordSchema,
});

/** `/forgot-password`: names the account by email; the reply never confirms it exists. */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(emailSchema),
});

/** `/reset-password?token=...`: the account comes from the emailed token. */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
