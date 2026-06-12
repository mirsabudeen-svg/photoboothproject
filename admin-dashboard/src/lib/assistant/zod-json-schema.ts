// Minimal zod → JSON Schema converter covering exactly what the registry uses.

import { z } from 'zod';

export function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      const { inner, optional } = unwrap(value);
      properties[key] = leaf(inner);
      if (!optional) required.push(key);
    }
    return {
      type: 'object',
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: false,
    };
  }
  return leaf(schema);
}

function unwrap(s: z.ZodTypeAny): { inner: z.ZodTypeAny; optional: boolean } {
  let optional = false;
  let inner = s;
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodNullable) {
    if (inner instanceof z.ZodOptional) optional = true;
    inner = inner.unwrap() as z.ZodTypeAny;
  }
  return { inner, optional };
}

function leaf(s: z.ZodTypeAny): Record<string, unknown> {
  if (s instanceof z.ZodString) {
    const checks = (s as { _def: { checks?: Array<{ kind: string; value?: number }> } })._def
      .checks ?? [];
    const out: Record<string, unknown> = { type: 'string' };
    for (const c of checks) {
      if (c.kind === 'uuid') out.format = 'uuid';
      if (c.kind === 'min') out.minLength = c.value;
      if (c.kind === 'max') out.maxLength = c.value;
    }
    return out;
  }
  if (s instanceof z.ZodBoolean) return { type: 'boolean' };
  if (s instanceof z.ZodNumber) return { type: 'number' };
  if (s instanceof z.ZodEnum) {
    const options = (s as { options: string[] }).options;
    return { type: 'string', enum: options };
  }
  if (s instanceof z.ZodArray) {
    return { type: 'array', items: leaf((s as z.ZodArray<z.ZodTypeAny>).element) };
  }
  return {};
}
