# Performance Audit

## Frontend (Admin Dashboard)

### Bundle & Loading

| Concern | Finding | Severity |
|---------|---------|----------|
| html2canvas + jsPDF | ~550KB imported at module level in `AnalyticsExport` | Medium |
| framer-motion + gsap | Both loaded; significant animation weight | Medium |
| react-webcam | Direct import, not `dynamic()` | Low |
| No bundle analyzer | `next.config.js` minimal | Low |
| Code splitting | App Router auto-splits per page | ✅ Good |
| Font loading | `next/font` with subsetting | ✅ Good |

### Rendering

| Concern | Finding |
|---------|---------|
| Dashboard GSAP counters | Re-run on every stat change; acceptable |
| Gallery infinite scroll | IntersectionObserver batches of 20 — efficient ✅ |
| Gallery images | `next/image` with `unoptimized` — bypasses CDN optimization |
| Server Components | `/events`, `/devices` fetch server-side — fast first paint ✅ |
| Client event detail | Waterfall: page load → fetch detail → render | Medium latency |

### Optimization Opportunities

1. `dynamic(() => import('html2canvas'))` for PDF export only
2. Add `images.remotePatterns` for R2 domain + Next.js image optimization
3. React Query/SWR for client-side caching of event detail
4. `experimental.optimizePackageImports` for lucide-react, framer-motion
5. Aggregate dashboard stats in single backend endpoint (avoid N+1)

**Score:** 6/10

---

## Backend (NestJS)

### API Response

| Endpoint | Expected Latency | Notes |
|----------|------------------|-------|
| `/health` | <50ms | DB + Redis ping |
| `GET /events` | <100ms | Small dataset |
| `GET /events/:id/detail` | 200–500ms | Multiple queries (stats, devices, captures, shares) |
| `GET /gallery/:id` | 100–300ms | Cursor pagination |
| `POST /captures` | <100ms | Presign only |
| `POST /captures/:id/complete` | <50ms response | Processing async via setImmediate |

### Query Efficiency

| Issue | Impact |
|-------|--------|
| `getDetail` pendingDeletion counts all captures | Inflated numbers |
| No index on `shares.captureId` | Slow share breakdown joins |
| No index on `analytics_events` | Slow if table grows |
| Gallery orders ASC, index is DESC | Suboptimal index use |

### Memory & Processing

| Concern | Finding | Severity |
|---------|---------|----------|
| Media processing in-process | sharp loads full image into memory on main thread | **High** |
| No worker queue for media | Blocks event loop under concurrent uploads | **High** |
| Connection pool max 20 | Adequate for single instance | OK |
| BullMQ SMS concurrency 3 | Rate-limited to 3/sec | OK |

### Optimization Opportunities

1. Move media processing to BullMQ worker queue
2. Add missing database indexes (4 identified)
3. Single aggregated `/dashboard/stats` endpoint
4. Redis caching for event config (device polls every 15min)
5. Connection pooling tuning under load test

**Score:** 6.5/10

---

## Android

### Startup

| Metric | Value | Target |
|--------|-------|--------|
| Cold start (emulator) | ~6s to attract | <3s |
| White splash duration | ~6s | <1s |
| Hilt graph initialization | Significant portion | Profile with Macrobenchmark |

**Causes:** Material Light NoActionBar theme, Hilt DI, WorkManager init, SQLCipher DB open.

### Memory

| Concern | Finding |
|---------|---------|
| Bitmap processing | Beauty filter + composite create new bitmaps; originals recycled ✅ |
| GIF encoding | Multiple frames in memory during burst | Monitor on 4GB tablet |
| CameraX | Standard lifecycle binding | OK |
| NanoHTTPD | Single-threaded; low overhead | OK |

### Camera Performance

| Mode | Frames | Interval | Risk |
|------|--------|----------|------|
| Photo | 1 | — | Low |
| GIF | 5 | 120ms | Medium CPU |
| Boomerang | 8 | 80ms | Medium CPU |

GIF LZW encoding runs on `Dispatchers.Default` ✅ (recent fix).

### Battery

| Concern | Finding |
|---------|---------|
| Battery optimization prompt every launch | User friction + potential background kill |
| WorkManager periodic sync (15min) | Acceptable |
| Token refresh (7-day) | Minimal |
| Camera preview idle on attract | Camera unbound — OK ✅ |
| NanoHTTPD always running | Low drain |

### Background Sync

| Worker | Schedule | Status |
|--------|----------|--------|
| UploadWorker | On capture | ⚠️ Hilt instantiation issue |
| ShareSyncWorker | On SMS enqueue | ⚠️ Hilt issue |
| EventConfigSyncWorker | 15min periodic | ⚠️ Hilt issue |
| TokenRefreshWorker | 7-day | ⚠️ Hilt issue |
| PrintWorker | On demand | ⚠️ Hilt issue |

**Critical:** Fix WorkManager + Hilt wiring for production reliability.

### Optimization Opportunities

1. Dark splash theme + Android 12 SplashScreen API
2. Fix WorkManager Hilt initialization (manifest change)
3. Lazy-init NanoHTTPD (start on first capture, not app init)
4. Skip battery optimization dialog on dev builds
5. Macrobenchmark cold start on Tab A9+
6. Fix GIF encoder extension block swap
7. GPU-accelerated beauty filter (TFLite/MediaPipe)

**Score:** 5.5/10 (startup + sync reliability)

---

## Performance Score Summary

| Layer | Score | Top Risk |
|-------|-------|----------|
| Admin frontend | 6/10 | Bundle weight, no image optimization |
| Backend | 6.5/10 | In-process media processing |
| Android | 5.5/10 | Cold start, WorkManager failures |
| **Overall** | **6/10** | Background sync + media pipeline |

---

## Recommended Benchmarks (Not Yet Run)

| Benchmark | Tool | Target |
|-----------|------|--------|
| Cold start | Macrobenchmark | <3s |
| Capture → share latency | Custom timer | <5s photo |
| Upload end-to-end | Integration test | <30s on venue WiFi |
| Gallery 100 items | Lighthouse | LCP <2.5s |
| Concurrent 5 devices uploading | k6 load test | No 5xx errors |
| SMS queue throughput | BullMQ metrics | <10s queue time |
