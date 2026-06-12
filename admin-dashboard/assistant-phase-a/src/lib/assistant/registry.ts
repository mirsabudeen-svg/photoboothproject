// src/lib/assistant/registry.ts
// Phase A tool registry — seven read-only tools mapped to existing endpoints.
// Adding a Tier 2 (mutating) tool later = add a def with `mutating: true`;
// the route refuses to auto-execute it until Phase B's confirmation gate exists.

import { z } from 'zod';
import { backendJson } from './backend';
import type { ToolDef } from './types';
import { zodToJsonSchema } from './zod-json-schema';

/* ----------------------------- helpers ----------------------------- */

/** Mask PII before anything reaches the LLM (share destinations etc.). */
function maskDestination(d: unknown): string {
  const s = String(d ?? '');
  return s.length > 4 ? `•••${s.slice(-4)}` : '•••';
}

function minutesAgo(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
}

/* ------------------------------ tools ------------------------------ */

const listEvents: ToolDef<z.ZodObject<{
  activeOnly: z.ZodOptional<z.ZodBoolean>;
  nameContains: z.ZodOptional<z.ZodString>;
}>> = {
  name: 'list_events',
  description:
    'List all events with id, name, type, active flag, and gallery publish state. ' +
    'Use this (or search by nameContains) to resolve an event the operator mentions ' +
    'by name BEFORE using get_event_detail or get_event_analytics.',
  schema: z.object({
    activeOnly: z.boolean().optional(),
    nameContains: z.string().min(1).max(80).optional(),
  }),
  mutating: false,
  execute: async (args) => {
    const events = await backendJson<any[]>('/events');
    let out = events;
    if (args.activeOnly) out = out.filter((e) => e.isActive);
    if (args.nameContains) {
      const q = args.nameContains.toLowerCase();
      out = out.filter((e) => String(e.name ?? '').toLowerCase().includes(q));
    }
    return out.map((e) => ({
      id: e.id,
      name: e.name,
      eventType: e.eventType,
      isActive: e.isActive,
      galleryPublished: Boolean(e.galleryPublishedAt),
      galleryExpiresAt: e.galleryExpiresAt ?? null,
    }));
  },
};

const getEventDetail: ToolDef<z.ZodObject<{ eventId: z.ZodString }>> = {
  name: 'get_event_detail',
  description:
    'Rich detail for ONE event: capture/share stats, paired devices with last-seen, ' +
    'recent captures, share channel breakdown, gallery + retention state. ' +
    'Requires a real eventId from list_events — never invent one.',
  schema: z.object({ eventId: z.string().uuid() }),
  mutating: false,
  execute: async ({ eventId }) => {
    const d = await backendJson<any>(`/events/${eventId}/detail`);
    // Mask share destinations before the model sees them.
    if (Array.isArray(d?.shares)) {
      d.shares = d.shares.map((s: any) => ({
        ...s,
        destination: maskDestination(s.destination),
      }));
    }
    return d;
  },
};

const listDevices: ToolDef<z.ZodObject<{}>> = {
  name: 'list_devices',
  description:
    'List the device fleet: name, model, lastSeenAt (plus computed minutesSinceSeen), ' +
    'token expiry, revoked state. Use for "which booths are online/quiet" questions. ' +
    'Treat a device unseen for more than ~5 minutes as potentially offline.',
  schema: z.object({}),
  mutating: false,
  execute: async () => {
    const devices = await backendJson<any[]>('/devices');
    return devices.map((d) => ({
      id: d.id,
      name: d.name,
      model: d.model,
      lastSeenAt: d.lastSeenAt ?? null,
      minutesSinceSeen: minutesAgo(d.lastSeenAt),
      tokenExpiresAt: d.tokenExpiresAt ?? null,
      revoked: Boolean(d.revokedAt),
    }));
  },
};

const getDashboardStats: ToolDef<z.ZodObject<{}>> = {
  name: 'get_dashboard_stats',
  description:
    'Workspace-wide aggregate stats (total captures, shares, devices, events). ' +
    'Use for overview questions; use get_event_detail for a single event.',
  schema: z.object({}),
  mutating: false,
  execute: async () => {
    // Internal Next.js aggregate exists per audit; prefer backend stats per event
    // when MI-14 lands. For Phase A we aggregate from /events + /devices.
    const [events, devices] = await Promise.all([
      backendJson<any[]>('/events'),
      backendJson<any[]>('/devices'),
    ]);
    const statsPerEvent = await Promise.all(
      events.slice(0, 25).map((e) =>
        backendJson<any>(`/events/${e.id}/stats`).catch(() => null),
      ),
    );
    const sum = (k: string) =>
      statsPerEvent.reduce((acc, s) => acc + (Number(s?.[k]) || 0), 0);
    return {
      totalEvents: events.length,
      activeEvents: events.filter((e) => e.isActive).length,
      totalDevices: devices.length,
      devicesSeenLast10Min: devices.filter(
        (d) => (minutesAgo(d.lastSeenAt) ?? Infinity) <= 10,
      ).length,
      totalCaptures: sum('captureCount') || sum('captures'),
      totalShares: sum('shareCount') || sum('shares'),
      note: 'Counts aggregated across up to 25 events; per-event detail via get_event_detail.',
    };
  },
};

const getEventStats: ToolDef<z.ZodObject<{ eventId: z.ZodString }>> = {
  name: 'get_event_stats',
  description:
    'Lightweight capture/share counts for ONE event (cheaper than get_event_detail). ' +
    'Use when the operator only wants numbers.',
  schema: z.object({ eventId: z.string().uuid() }),
  mutating: false,
  execute: ({ eventId }) => backendJson(`/events/${eventId}/stats`),
};

const getSystemHealth: ToolDef<z.ZodObject<{}>> = {
  name: 'get_system_health',
  description:
    'Backend health: database, Redis, queue depths, version. ' +
    'Use first when the operator reports anything looking broken or slow.',
  schema: z.object({}),
  mutating: false,
  execute: () => backendJson('/health'),
};

const diagnoseDevice: ToolDef<z.ZodObject<{ deviceNameOrId: z.ZodString }>> = {
  name: 'diagnose_device',
  description:
    'Composite diagnostic for one booth: resolves by name or id, returns last-seen, ' +
    'token state, and system health context in one call. ' +
    'Use for "why is booth X quiet / offline / not uploading" questions.',
  schema: z.object({ deviceNameOrId: z.string().min(1).max(120) }),
  mutating: false,
  execute: async ({ deviceNameOrId }) => {
    const [devices, health] = await Promise.all([
      backendJson<any[]>('/devices'),
      backendJson<any>('/health').catch(() => null),
    ]);
    const q = deviceNameOrId.toLowerCase();
    const matches = devices.filter(
      (d) =>
        d.id === deviceNameOrId ||
        String(d.name ?? '').toLowerCase().includes(q),
    );
    if (matches.length === 0) {
      return { found: false, hint: 'No device matched. Available names:', names: devices.map((d) => d.name) };
    }
    if (matches.length > 1) {
      return { found: false, ambiguous: true, candidates: matches.map((d) => ({ id: d.id, name: d.name })) };
    }
    const d = matches[0];
    const mins = minutesAgo(d.lastSeenAt);
    return {
      found: true,
      device: {
        id: d.id,
        name: d.name,
        model: d.model,
        lastSeenAt: d.lastSeenAt,
        minutesSinceSeen: mins,
        likelyOffline: mins === null || mins > 5,
        tokenExpiresAt: d.tokenExpiresAt,
        tokenExpired: d.tokenExpiresAt ? new Date(d.tokenExpiresAt) < new Date() : null,
        revoked: Boolean(d.revokedAt),
      },
      backendHealth: health,
    };
  },
};

/* ----------------------------- registry ---------------------------- */

const tools: ToolDef<any>[] = [
  listEvents,
  getEventDetail,
  listDevices,
  getDashboardStats,
  getEventStats,
  getSystemHealth,
  diagnoseDevice,
];

export const registry = {
  get: (name: string) => tools.find((t) => t.name === name),
  all: () => tools,
  /** OpenAI tools schema (also compatible with most providers' tool formats). */
  toOpenAiTools: () =>
    tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: zodToJsonSchema(t.schema),
      },
    })),
};
