import { act, renderHook } from "@testing-library/react-native";

import { useSchemaForm } from "./use-schema-form";

type Values = { email: string; password: string };

/** A schema that reports several issues per field, plus two for no field. */
const schema = {
  safeParse(input: unknown) {
    const { email, password } = input as Values;
    const issues: { path: PropertyKey[]; message: string }[] = [];
    if (!email) issues.push({ path: ["email"], message: "Email is required" });
    if (!email.includes("@"))
      issues.push({ path: ["email"], message: "Email is invalid" });
    if (password.length < 8)
      issues.push({ path: ["password"], message: "Password is too short" });
    if (password.length < 4)
      issues.push({
        path: ["password"],
        message: "Password is much too short",
      });
    issues.push({ path: ["stray"], message: "Not a field" });
    issues.push({ path: [], message: "Form-level" });
    return { success: false, error: { issues } } as const;
  },
};

const okSchema = {
  safeParse: (input: unknown) => ({ success: true, data: input }) as const,
};

function setup() {
  return renderHook(() =>
    useSchemaForm({ schema, initialValues: { email: "", password: "" } }),
  );
}

describe("useSchemaForm", () => {
  it("shows only the first message per field, and none for unknown paths", async () => {
    const { result } = await setup();

    let output: unknown = "unset";
    await act(async () => {
      output = result.current.validate();
    });

    expect(output).toBeUndefined();
    expect(result.current.errors).toEqual({
      email: "Email is required",
      password: "Password is too short",
    });
  });

  it("clears only the edited field's error as the listener types", async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.validate();
    });

    await act(async () => result.current.setValue("email", "a@b.c"));

    expect(result.current.values.email).toBe("a@b.c");
    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.password).toBe("Password is too short");
  });

  it("returns the parsed output and clears every error when valid", async () => {
    const { result } = await renderHook(() =>
      useSchemaForm({ schema: okSchema, initialValues: { name: "Asha" } }),
    );
    let output: unknown;
    await act(async () => {
      output = result.current.validate();
    });
    expect(output).toEqual({ name: "Asha" });
    expect(result.current.errors).toEqual({});
  });
});
