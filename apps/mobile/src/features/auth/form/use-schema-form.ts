import { useState } from "react";

/**
 * The slice of a Zod schema the form needs, so the app does not depend on
 * `zod` itself: the schemas of `@infinitunes/auth/schemas` fit it.
 */
export type FormSchema<Output> = {
  safeParse(input: unknown):
    | { success: true; data: Output }
    | {
        success: false;
        error: {
          issues: readonly { path: readonly PropertyKey[]; message: string }[];
        };
      };
};

type FormValues = Record<string, string>;

type FieldErrors<Values extends FormValues> = {
  [Name in keyof Values]?: string;
};

type SchemaFormOptions<Values extends FormValues, Output> = {
  schema: FormSchema<Output>;
  initialValues: Values;
};

/**
 * Text field state validated by a Zod schema on submit, like the web's
 * react-hook-form setup: the first message per field is shown, and typing in
 * a field clears its error.
 */
export function useSchemaForm<Values extends FormValues, Output>({
  schema,
  initialValues,
}: SchemaFormOptions<Values, Output>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<Values>>({});

  function setValue(name: keyof Values, text: string) {
    setValues((current) => ({ ...current, [name]: text }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  /** The parsed output, or `undefined` after showing every field's message. */
  function validate(): Output | undefined {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return result.data;
    }
    const next: FieldErrors<Values> = {};
    for (const { path, message } of result.error.issues) {
      const name = String(path[0]);
      if (name in values && !(name in next)) {
        next[name as keyof Values] = message;
      }
    }
    setErrors(next);
    return undefined;
  }

  return { values, errors, setValue, validate };
}
