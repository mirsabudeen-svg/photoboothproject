// src/lib/assistant/zod-json-schema.ts
// Minimal zod → JSON Schema converter covering exactly what the registry uses
// (objects of strings / booleans, optional, uuid, min/max length).
// Swap for the `zod-to-json-schema` package if your schemas grow richer.

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
    inner = inner.unwrap();
  }
  return { inner, optional };
}

function leaf(s: z.ZodTypeAny): Record<string, unknown> {
  if (s instanceof z.ZodString) {
    const checks = (s as any)._def.checks ?? [];
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
  if (s instanceof z.ZodEnum) return { type: 'string', enum: (s as any).options };
  if (s instanceof z.ZodArray) return { type: 'array', items: leaf((s as any).element) };
  return {}; // permissive fallback
}
