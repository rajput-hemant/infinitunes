import { describe, expect, it } from "bun:test";

import {
  emailSchema,
  loginSchema,
  passwordSchema,
  resetPasswordSchema,
  signUpSchema,
  usernameSchema,
} from "../src/schemas";

describe("usernameSchema", () => {
  it("accepts valid usernames between 8 and 15 characters", () => {
    expect(usernameSchema.safeParse("validuser").success).toBe(true);
    expect(usernameSchema.safeParse("user_name").success).toBe(true);
    expect(usernameSchema.safeParse("user.name").success).toBe(true);
    expect(usernameSchema.safeParse("user-name").success).toBe(true);
    expect(usernameSchema.safeParse("12345678").success).toBe(true);
    expect(usernameSchema.safeParse("user_1234567890").success).toBe(true);
  });

  it("rejects empty, short, or overly long usernames", () => {
    expect(usernameSchema.safeParse("").success).toBe(false);
    expect(usernameSchema.safeParse("short").success).toBe(false);
    expect(usernameSchema.safeParse("toolongusername123456").success).toBe(
      false,
    );
  });

  it("rejects usernames with disallowed characters or spaces", () => {
    expect(usernameSchema.safeParse("user name").success).toBe(false);
    expect(usernameSchema.safeParse("user@name").success).toBe(false);
    expect(usernameSchema.safeParse("user#1234").success).toBe(false);
  });
});

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
  it("validates username logins", () => {
    const valid = loginSchema.safeParse({
      type: "username",
      username: "validuser",
      password: "Password123!",
    });
    expect(valid.success).toBe(true);

    const invalid = loginSchema.safeParse({
      type: "username",
      username: "bad",
      password: "Password123!",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates email logins", () => {
    const valid = loginSchema.safeParse({
      type: "email",
      email: "user@example.com",
      password: "Password123!",
    });
    expect(valid.success).toBe(true);

    const invalid = loginSchema.safeParse({
      type: "email",
      email: "invalid-email",
      password: "Password123!",
    });
    expect(invalid.success).toBe(false);
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

  it("fails when any field is invalid", () => {
    const invalid = resetPasswordSchema.safeParse({
      email: "not-an-email",
      password: "OldPassword123!",
      newPassword: "NewPassword123!",
    });
    expect(invalid.success).toBe(false);
  });
});
