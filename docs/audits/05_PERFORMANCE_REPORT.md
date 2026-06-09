# Performance Report

## Frontend (Admin Dashboard)

| Metric | Value | Assessment |
|--------|-------|------------|
| First Load JS (home) | ~96 kB | **Good** |
| First Load JS (shared) | ~87 kB | **Good** |
| Route count | 7 | Minimal |
| Code splitting | Next.js default | **Adequate** |
| Lazy loading | None custom | OK for size |
| Images | None optimized | N/A |

**Recommendations (ranked by impact):**

1. **Low priority** — Admin is already lean; defer TanStack Query until >5 data sources
2. Add `loading.tsx` / `error.tsx` — UX not bundle impact
3. When UI grows, adopt shadcn/ui with tree-shaking

## Frontend (Android Kiosk)

| Area | Finding | Impact |
|------|---------|--------|
| Compose recomposition | NavHost holds minimal state | Low |
| Bitmap pipeline | Decode → filter → composite on main coroutine | **High** — move to `Dispatchers.Default` |
| Memory | Bitmaps recycled in photo path | Good |
| GIF/boomerang | Not implemented | N/A |
| WorkManager | 15-min periodic + on-demand | Good |
| SQLCipher | Encryption overhead on every query | Medium — acceptable for privacy |
| TFLite/GPUImage | Unprofiled on target tablet | **High** — benchmark on Samsung Tab A9+ or equivalent |

**Recommendations:**

1. **Critical:** Profile capture→print latency on target hardware; target < 3s
2. Run compositor + filter off main thread
3. Downscale before filter if > 4MP
4. Use `Bitmap.Config.RGB_565` for preview only

## Backend

| Area | Finding | Impact |
|------|---------|--------|
| API latency | Not measured | Unknown |
| DB queries | Simple CRUD; stats uses JOIN count | Low N+1 risk |
| Presign | Single S3 call per capture | Good |
| Analytics batch | Bulk insert | Good |
| Caching | None | Medium for event config |

**Recommendations:**

1. Cache `GET /events/:id/config` in Redis (60s TTL) when multiple kiosks per event
2. Add DB indexes: `captures(eventId)`, `shares(captureId)` — verify in migrations
3. Connection pooling via TypeORM defaults — tune for prod load
4. Add `@nestjs/throttler` before optimizing further

## Image CDN

- R2 public base URL documented — **not wired** for guest gallery
- Local QR bypasses CDN — correct for offline LAN

## Hydration

- Admin uses server components for list/stats — **no hydration issues observed**
- Client form page minimal

## Scalability Bottlenecks

1. NestJS single instance SMS dispatch (when Twilio added)
2. No horizontal scaling story for local QR (per-device by design)
3. PostgreSQL single region — OK for MVP

## Optimization Roadmap

| Priority | Item | Est. impact |
|----------|------|-------------|
| P0 | Off-main-thread image processing | High UX |
| P1 | Hardware benchmark suite | Prevents field surprises |
| P2 | Event config Redis cache | Medium at 10+ booths |
| P3 | R2 CDN custom domain | Faster remote gallery |
| P4 | WebP composite output | Smaller uploads |
