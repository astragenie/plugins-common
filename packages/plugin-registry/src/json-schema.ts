/**
 * Minimal JSON Schema (subset) validator — just enough of draft 2020-12 to
 * validate this package's own committed `schema/agents.schema.json` and
 * `schema/skills.schema.json` (an array of flat objects with string
 * properties). Deliberately hand-rolled rather than a third-party
 * dependency: the shape validated here is small and stable, and
 * `@astragenie/plugin-std`'s own stated design goal is "no lifecycle, no
 * IoC" / minimal footprint — pulling in a general JSON Schema engine for
 * four string fields would be the opposite of that.
 */
export interface JsonSchema {
  readonly type?: "array" | "object" | "string";
  readonly items?: JsonSchema;
  readonly properties?: Record<string, JsonSchema>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly pattern?: string;
  readonly minLength?: number;
}

/** Validate `value` against `schema`, returning a flat list of human-readable errors (empty = valid). */
export function validateAgainstSchema(schema: JsonSchema, value: unknown, path = "$"): string[] {
  const errors: string[] = [];

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected array`);
      return errors;
    }
    if (schema.items) {
      const itemSchema = schema.items;
      value.forEach((item, i) => {
        errors.push(...validateAgainstSchema(itemSchema, item, `${path}[${i}]`));
      });
    }
    return errors;
  }

  if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push(`${path}: expected object`);
      return errors;
    }
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) {
        errors.push(`${path}.${key}: missing required property`);
      }
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          errors.push(...validateAgainstSchema(propSchema, obj[key], `${path}.${key}`));
        }
      }
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(obj)) {
        if (!allowed.has(key)) {
          errors.push(`${path}.${key}: additional property not allowed`);
        }
      }
    }
    return errors;
  }

  if (schema.type === "string") {
    if (typeof value !== "string") {
      errors.push(`${path}: expected string`);
      return errors;
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path}: does not match pattern ${schema.pattern}`);
    }
    return errors;
  }

  return errors;
}
