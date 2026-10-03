import * as z from "zod";

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

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

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

/** Signed-in change: the account comes from the session, not the input. */
export const changePasswordSchema = z.object({
  password: passwordSchema,
  newPassword: passwordSchema,
});

/** Logged-out flow only (`/reset-password` page); it names the account by email. */
export const resetPasswordSchema = z.object({
  // Stored emails are lowercased; normalize before validating so lookups match.
  email: z.string().trim().toLowerCase().pipe(emailSchema),
  password: passwordSchema,
  newPassword: passwordSchema,
});
