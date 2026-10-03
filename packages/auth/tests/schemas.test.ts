import { describe, expect, it } from "bun:test";

import {
  emailSchema,
  loginSchema,
  passwordSchema,
  changePasswordSchema,
  resetPasswordSchema,
  signUpSchema,
} from "../src/schemas";

describe("emailSchema", () => {
  it("accepts valid email addresses", () => {
    expect(emailSchema.safeParse("test@example.com").success).toBe(true);
    expect(emailSchema.safeParse("user.name@domain.co").success).toBe(true);
  });

  it("rejects invalid emails and empty strings", () => {
    expect(emailSchema.safeParse("").success).toBe(false);
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("@example.com").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts strong passwords meeting all requirements", () => {
    expect(passwordSchema.safeParse("Password123!").success).toBe(true);
    expect(passwordSchema.safeParse("Valid#Pass9").success).toBe(true);
  });

  it("rejects passwords lacking required complexity", () => {
    expect(passwordSchema.safeParse("short1!").success).toBe(false);
    expect(passwordSchema.safeParse("password123!").success).toBe(false);
    expect(passwordSchema.safeParse("PASSWORD123!").success).toBe(false);
    expect(passwordSchema.safeParse("Password!@#$").success).toBe(false);
    expect(passwordSchema.safeParse("Password1234").success).toBe(false);
    expect(passwordSchema.safeParse("        ").success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("validates email logins and rejects username-shaped payloads", () => {
    const valid = loginSchema.safeParse({
      email: "user@example.com",
      password: "Password123!",
    });
    expect(valid.success).toBe(true);

    const invalid = loginSchema.safeParse({
      email: "invalid-email",
      password: "Password123!",
    });
    expect(invalid.success).toBe(false);

    const legacyUsername = loginSchema.safeParse({
      type: "username",
      username: "validuser",
      password: "Password123!",
    });
    expect(legacyUsername.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("validates matching password and confirmPassword", () => {
    const valid = signUpSchema.safeParse({
      email: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
    expect(valid.success).toBe(true);
  });

  it("fails when password and confirmPassword differ", () => {
    const invalid = signUpSchema.safeParse({
      email: "user@example.com",
      password: "Password123!",
      confirmPassword: "DifferentPassword123!",
    });
    expect(invalid.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("validates reset password credentials", () => {
    const valid = resetPasswordSchema.safeParse({
      email: "user@example.com",
      password: "OldPassword123!",
      newPassword: "NewPassword123!",
    });
    expect(valid.success).toBe(true);
  });

  it("trims and lowercases the email", () => {
    const parsed = resetPasswordSchema.safeParse({
      email: "  User@Example.COM ",
      password: "OldPassword123!",
      newPassword: "NewPassword123!",
    });
    expect(parsed.success && parsed.data.email).toBe("user@example.com");
  });

  it("fails when any field is invalid", () => {
    const invalid = resetPasswordSchema.safeParse({
      email: "not-an-email",
      password: "OldPassword123!",
      newPassword: "NewPassword123!",
    });
    expect(invalid.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("takes no email: the account comes from the session", () => {
    const parsed = changePasswordSchema.safeParse({
      password: "OldPassword123!",
      newPassword: "NewPassword123!",
    });
    expect(parsed.success).toBe(true);
  });

  it("applies the password rules to the new password", () => {
    const parsed = changePasswordSchema.safeParse({
      password: "OldPassword123!",
      newPassword: "weak",
    });
    expect(parsed.success).toBe(false);
  });
});
