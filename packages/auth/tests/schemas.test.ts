import { describe, expect, it } from "bun:test";

import {
  emailSchema,
  forgotPasswordSchema,
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
  it.each([
    "A1!" + "a".repeat(70),
    "Aa1!" + "é".repeat(35),
    "A1!" + "a".repeat(126),
  ])("rejects a new password exceeding 72 UTF-8 bytes: %s", (password) => {
    const result = passwordSchema.safeParse(password);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "Password must be at most 72 UTF-8 bytes long (some characters use more than one byte).",
      );
    }
    expect(
      signUpSchema.safeParse({
        email: "user@example.com",
        password,
        confirmPassword: password,
      }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ password, confirmPassword: password })
        .success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        password: "CurrentPassword1!",
        newPassword: password,
      }).success,
    ).toBe(false);
  });

  it.each([
    "A1!" + "a".repeat(69),
    "A1!" + "é".repeat(34) + "a",
    "A1!" + "😀".repeat(17) + "a",
  ])("accepts a new password of exactly 72 UTF-8 bytes: %s", (password) =>
    expect(passwordSchema.safeParse(password).success).toBe(true),
  );

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

describe("loginSchema legacy passwords", () => {
  it("accepts any non-empty password but still requires one", () => {
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "weak" })
        .success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "" })
        .success,
    ).toBe(false);
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

  it("rejects a name longer than 100 characters", () => {
    const invalid = signUpSchema.safeParse({
      email: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      name: "a".repeat(101),
    });
    expect(invalid.success).toBe(false);
  });

  it("accepts a name up to 100 characters", () => {
    const valid = signUpSchema.safeParse({
      email: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      name: "a".repeat(100),
    });
    expect(valid.success).toBe(true);
  });

  it("accepts name with leading/trailing whitespace within 100 chars after trim", () => {
    const valid = signUpSchema.safeParse({
      email: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      name: " " + "a".repeat(100),
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

describe("forgotPasswordSchema", () => {
  it("trims and lowercases the email", () => {
    const parsed = forgotPasswordSchema.safeParse({
      email: "  User@Example.COM ",
    });
    expect(parsed.success && parsed.data.email).toBe("user@example.com");
  });

  it("rejects an invalid or missing email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(
      false,
    );
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts a strong password that matches its confirmation", () => {
    const valid = resetPasswordSchema.safeParse({
      password: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });
    expect(valid.success).toBe(true);
  });

  it("applies the shared password rules", () => {
    const weak = resetPasswordSchema.safeParse({
      password: "weak",
      confirmPassword: "weak",
    });
    expect(weak.success).toBe(false);
  });

  it("flags a mismatched confirmation on confirmPassword", () => {
    const result = resetPasswordSchema.safeParse({
      password: "NewPassword123!",
      confirmPassword: "Different123!",
    });
    expect(result.success).toBe(false);
    expect(!result.success && result.error.issues[0]?.path).toEqual([
      "confirmPassword",
    ]);
  });
});

describe("changePasswordSchema", () => {
  it.each(["weak", "a".repeat(100)])(
    "accepts a legacy current password: %s",
    (password) => {
      expect(
        changePasswordSchema.safeParse({
          password,
          newPassword: "NewPassword123!",
        }).success,
      ).toBe(true);
    },
  );

  it.each(["", "a".repeat(129)])(
    "rejects an empty or oversized current password: %s",
    (password) => {
      expect(
        changePasswordSchema.safeParse({
          password,
          newPassword: "NewPassword123!",
        }).success,
      ).toBe(false);
    },
  );

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
