import { z } from 'zod';
import type { ToolDef } from '../types';
import { ToolError } from '../types';

const EventConfig = z.object({
  theme: z.string().optional(),
  captureMode: z.string().optional(),
  consentText: z.string().min(20).optional(),
  shareChannels: z.array(z.enum(['qr', 'sms', 'email', 'whatsapp'])).min(1).optional(),
  retentionDays: z.number().int().min(1).max(365).optional(),
  hashtag: z.string().optional(),
});

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export const createEvent: ToolDef<z.ZodObject<{
  name: z.ZodString;
  eventType: z.ZodOptional<z.ZodString>;
  config: z.ZodOptional<typeof EventConfig>;
}>> = {
  name: 'create_event',
  description:
    'Create a new photobooth event. Requires operator confirmation before it runs.',
  schema: z.object({
    name: z.string().min(3).max(120),
    eventType: z.string().optional(),
    config: EventConfig.optional(),
  }),
  mutating: true,
  execute: async (args, ctx) => {
    const res = await ctx.backendFetch('/events', {
      method: 'POST',
      body: JSON.stringify({
        name: args.name,
        eventType: args.eventType,
        config: args.config ?? {},
      }),
    });
    if (!res.ok) throw new ToolError(`Create event failed (${res.status})`, res.status);
    return parseJson(res);
  },
};

export const publishGallery: ToolDef<z.ZodObject<{ eventId: z.ZodString }>> = {
  name: 'publish_gallery',
  description:
    'Publish the guest gallery for an event. Requires operator confirmation. ' +
    'Use list_events first to resolve eventId.',
  schema: z.object({ eventId: z.string().uuid() }),
  mutating: true,
  execute: async ({ eventId }, ctx) => {
    const res = await ctx.backendFetch(`/events/${eventId}/gallery/publish`, {
      method: 'POST',
    });
    if (!res.ok) throw new ToolError(`Publish gallery failed (${res.status})`, res.status);
    return parseJson(res);
  },
};

export const unpublishGallery: ToolDef<z.ZodObject<{ eventId: z.ZodString }>> = {
  name: 'unpublish_gallery',
  description:
    'Unpublish the guest gallery for one event. Requires operator confirmation.',
  schema: z.object({ eventId: z.string().uuid() }),
  mutating: true,
  execute: async ({ eventId }, ctx) => {
    const res = await ctx.backendFetch(`/events/${eventId}/gallery/publish`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new ToolError(`Unpublish gallery failed (${res.status})`, res.status);
    return parseJson(res);
  },
};

export const unpublishGalleriesBatch: ToolDef<z.ZodObject<{ eventIds: z.ZodArray<z.ZodString> }>> = {
  name: 'unpublish_galleries_batch',
  description:
    'Unpublish galleries for multiple events. Requires operator confirmation.',
  schema: z.object({ eventIds: z.array(z.string().uuid()).min(1).max(25) }),
  mutating: true,
  execute: async ({ eventIds }, ctx) => {
    const results: Array<{ eventId: string; ok: boolean; status?: number }> = [];
    for (const eventId of eventIds) {
      const res = await ctx.backendFetch(`/events/${eventId}/gallery/publish`, {
        method: 'DELETE',
      });
      results.push({ eventId, ok: res.ok, status: res.status });
    }
    return { results, succeeded: results.filter((r) => r.ok).length };
  },
};

export const triggerRetentionSweep: ToolDef<z.ZodObject<Record<string, never>>> = {
  name: 'trigger_retention_sweep',
  description:
    'Run the retention sweep (purge expired captures). Requires operator confirmation.',
  schema: z.object({}),
  mutating: true,
  execute: async (_args, ctx) => {
    const res = await ctx.backendFetch('/admin/retention/sweep', { method: 'POST' });
    if (!res.ok) throw new ToolError(`Retention sweep failed (${res.status})`, res.status);
    return parseJson(res);
  },
};
