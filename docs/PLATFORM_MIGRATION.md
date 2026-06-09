# Platform P1 Migration Checklist

After 3+ successful wedding deployments, migrate to full Platform per Master PRD.

## 1. Tenancy

- [ ] Add `tenant_id` column to all Postgres tables
- [ ] Enable PostgreSQL RLS policies (`app.current_tenant_id`)
- [ ] Add `tenant_id` to Room entities (nullable → required)
- [ ] Migrate single-operator auth to JWT with tenant claim

## 2. Event OS

- [ ] Replace on-device demo event creation with web Event OS wizard
- [ ] Server-authoritative config pull (already shaped as `configJson`)
- [ ] Versioned config with LWW conflict resolution

## 3. Billing & Fleet

- [ ] Stripe subscriptions (Starter/Pro/Studio/Enterprise)
- [ ] Device fleet module: telemetry, remote commands, queue heartbeat

## 4. AI (V1)

- [ ] Extract cloud AI to FastAPI orchestrator + Fal.ai
- [ ] Keep on-device filters in `:feature:ai` as edge path
- [ ] AI credit ledger + metering

## 5. Printing

- [ ] Promote companion-host (Pi) HTTP for DNP dye-sub
- [ ] Keep ESC/POS as secondary thermal path

## 6. Sharing

- [ ] WhatsApp Business API via Twilio/BSP
- [ ] Cloudflare Worker gallery pages at custom share domain

## 7. Analytics

- [ ] Postgres aggregates at V1; ClickHouse at V2 if needed

## 8. Compliance

- [ ] DPIA for any new face-touching features
- [ ] No biometric storage (hard line from Master PRD §9.4)

## Module refactor (minimal if seams respected)

- `:core:domain` interfaces unchanged
- Add `:feature:*` cloud sync for tenant-scoped APIs
- Split `backend` modules already aligned with NestJS monolith plan
