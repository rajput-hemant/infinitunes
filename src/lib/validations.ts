import { z } from "zod";

export const authSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is Required")
      .email("Please enter a valid email"),
    password: z
      .string()
      .min(1, "Password is Required")
      .regex(/^(?!\s*$).+/, "Password must not contain Whitespaces.")
      .regex(
        /^(?=.*[A-Z])/,
        "Password must contain at least one uppercase letter."
      )
      .regex(
        /^(?=.*[a-z])/,
        "Password must contain at least one lowercase letter."
      )
      .regex(/^(?=.*\d)/, "Password must contain at least one number.")
      .regex(
        /^(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹])/,
        "Password must contain at least one special character."
      )
      .min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
