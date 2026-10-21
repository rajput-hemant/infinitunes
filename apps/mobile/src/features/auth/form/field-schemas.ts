import type { FormSchema } from "./use-schema-form";

type OutputOf<Schema> =
  Schema extends FormSchema<infer Output> ? Output : never;

type Issue = { path: readonly PropertyKey[]; message: string };

/**
 * One form schema from a schema per field, e.g. `{ name: nameSchema, email:
 * emailSchema }`, for forms whose fields have no object schema of their own.
 * Every field is checked, so each shows its message.
 */
export function fieldSchemas<
  Fields extends Record<string, FormSchema<unknown>>,
>(
  fields: Fields,
): FormSchema<{ [Name in keyof Fields]: OutputOf<Fields[Name]> }> {
  return {
    safeParse(input) {
      const values: Record<string, unknown> =
        typeof input === "object" && input !== null ? { ...input } : {};
      const data: Record<string, unknown> = {};
      const issues: Issue[] = [];

      for (const [name, schema] of Object.entries(fields)) {
        const result = schema.safeParse(values[name]);
        if (result.success) data[name] = result.data;
        else {
          for (const { message } of result.error.issues) {
            issues.push({ path: [name], message });
          }
        }
      }

      // Each name holds its own schema's output, which `Fields` records.
      return issues.length > 0
        ? { success: false, error: { issues } }
        : { success: true, data: data as never };
    },
  };
}
