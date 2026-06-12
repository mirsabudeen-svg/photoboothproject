# Database & API Audit

## Database Structure

### PostgreSQL Tables (5)

```mermaid
erDiagram
    devices ||--o{ captures : "deviceId soft-link"
    events ||--o{ captures : "eventId soft-link"
    captures ||--o{ shares : "captureId soft-link"
    devices ||--o{ analytics_events : "deviceId soft-link"

    devices {
        uuid id PK
        string name
        string model
        string accessToken UK
        string currentEventId "never populated"
        timestamp tokenExpiresAt
        timestamp lastSeenAt
        timestamp revokedAt
    }

    events {
        uuid id PK
        string name
        string eventType
        jsonb config
        string galleryToken UK
        timestamp galleryPublishedAt
        timestamp galleryExpiresAt
        boolean isActive
    }

    captures {
        uuid id PK
        uuid eventId
        uuid deviceId
        string captureType
        string idempotencyKey UK
        string objectKey
        string webpKey
        string thumbKey
        string printKey
        string status
        timestamp expiresAt
    }

    shares {
        uuid id PK
        uuid captureId
        string channel
        string destination
        string status
        string providerMessageId
    }

    analytics_events {
        uuid id PK
        uuid deviceId
        string type
        jsonb payload
        timestamp occurredAt
    }
```

**Note:** No `@ManyToOne` / FK constraints — soft-linked by UUID columns only.

### Indexes (Migration 5)

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| Composite | captures | `(eventId, createdAt DESC)` | Gallery pagination |
| Partial | captures | `expiresAt WHERE status != 'deleted'` | Retention sweep |
| Partial | shares | `providerMessageId WHERE NOT NULL` | Twilio webhook lookup |
| Standard | devices | `lastSeenAt` | Fleet health |

### Missing Indexes

- `captures.status`
- `shares.captureId`
- `captures.deviceId`
- `analytics_events.(deviceId, occurredAt)`

---

## Android Room Database (7 tables)

| Table | Purpose |
|-------|---------|
| `events` | Local event config |
| `captures` | Capture records + paths |
| `shares` | Outbound share queue |
| `consent_records` | GDPR consent log |
| `print_jobs` | Print queue |
| `sync_state` | Last sync timestamps |
| `active_event` | Singleton active event pointer |

**Encryption:** SQLCipher via Room

---

## API Catalog

Base URL: `/api/v1`

### Devices

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/devices/pair` | None (rate 3/min) | Register device, return 90-day token |
| POST | `/devices/token/refresh` | Device token | Rotate access token |
| GET | `/devices` | Admin API key | List all devices |

### Events

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/events` | Admin key | Create event |
| GET | `/events` | Admin key | List events |
| GET | `/events/:id/config` | Device token | Config for kiosk |
| GET | `/events/:id/stats` | Admin key | Capture/share counts |
| GET | `/events/:id/detail` | Admin key | Rich detail view |
| POST | `/events/:id/gallery/publish` | Admin key | Publish gallery |
| DELETE | `/events/:id/gallery/publish` | Admin key | Unpublish + rotate token |

### Captures

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/captures` | Device token | Create + presigned PUT URL (15min) |
| POST | `/captures/:id/complete` | Device token | Confirm upload, trigger processing |

### Gallery (Public)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/gallery/:eventId` | Query token | Paginated gallery (cursor, max 100) |

### Shares

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/shares` | Device token (rate 10/min) | Queue share (SMS etc.) |

### Webhooks

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/webhooks/twilio/status` | Twilio signature (prod) | Delivery status |

### Analytics

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/analytics/batch` | Manual token check | Batch event ingest |

### Admin

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/admin/retention/sweep` | Admin key | Manual retention run |

### Health

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/health` | None | DB, Redis, queue depths, version |

### Admin Dashboard Internal APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/dashboard/stats` | Aggregate stats |
| POST | `/api/events` | Proxy create event |
| GET | `/api/events/[id]/detail` | Proxy event detail |
| POST/DELETE | `/api/events/[id]/gallery/publish` | Gallery toggle |
| GET | `/api/gallery/download` | Image download proxy |
| POST | `/api/ai/generate` | GPT-4o-mini content |

### On-Device API (NanoHTTPD)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/media/:captureId?token=` | HMAC token (15min) | Serve local image |

---

## Authentication

### Methods

| Actor | Method | Header/Param |
|-------|--------|--------------|
| Kiosk device | Bearer token (64-char hex) | `Authorization: Bearer {token}` |
| Admin operator | API key | `X-Admin-Api-Key: {key}` |
| Admin user | Supabase session | Cookie (dashboard only) |
| Gallery guest | Gallery token | `?token={12-char hex}` |
| Local QR guest | HMAC signed token | `?token={captureId:expires:sig}` |
| Twilio webhook | Request signature | `X-Twilio-Signature` |

### Roles & Permissions

| Role | Capabilities | Gap |
|------|--------------|-----|
| Anonymous | Health, pair (with code), gallery (with token) | — |
| Device | Captures, shares, config, token refresh | No per-event scope |
| Admin | All management endpoints | No RBAC; key is all-or-nothing |
| Supabase user | Dashboard access only | Not linked to backend roles |

### Token Lifecycle

```mermaid
sequenceDiagram
    participant K as Kiosk
    participant API as Backend

    K->>API: POST /devices/pair
    API-->>K: accessToken (90 days)
    Note over K: Stored in DataStore
    K->>API: Authenticated requests
    K->>API: POST /devices/token/refresh
    API-->>K: New token (90 days)
    Note over K: TokenRefreshWorker (7-day check)
```

---

## Data Flow

### Capture Upload Flow

```mermaid
sequenceDiagram
    participant K as Kiosk
    participant Room as Room DB
    participant API as Backend
    participant R2 as R2
    participant Sharp as Media Processor

    K->>Room: Save capture locally
    K->>API: POST /captures (idempotency key)
    API-->>K: presigned PUT URL
    K->>R2: PUT original image
    K->>API: POST /captures/:id/complete
    API->>R2: GET original
    API->>Sharp: Generate webp/thumb/print
    Sharp->>R2: PUT variants
    API->>API: Update capture record
```

### Share SMS Flow

```mermaid
sequenceDiagram
    participant K as Kiosk
    participant API as Backend
    participant Q as BullMQ
    participant T as Twilio
    participant G as Guest

    K->>API: POST /shares (SMS channel)
    API->>Q: Enqueue job
    Q->>T: Send MMS with media URL
    T->>G: SMS delivered
    T->>API: POST /webhooks/twilio/status
    API->>API: Update share status
```

### Gallery View Flow

```mermaid
sequenceDiagram
    participant Op as Operator
    participant Admin as Admin
    participant API as Backend
    participant Guest as Guest Browser
    participant R2 as R2

    Op->>Admin: Publish gallery
    Admin->>API: POST gallery/publish
    Guest->>API: GET /gallery/:id?token=
    API-->>Guest: Capture list + R2 URLs
    Guest->>R2: Load images
```

---

## Data Validation

| Layer | Validation |
|-------|------------|
| Backend DTOs | class-validator decorators |
| Create event | retentionDays 1–365, consent min 20 chars |
| SMS phone | E.164 regex in SmsService |
| Capture complete | Magic byte check (JPEG/PNG/WebP) |
| Gallery token | 12-char hex regex |
| Android SMS input | E.164 regex in ShareScreen |

### Validation Gaps

- `CompleteCaptureDto.objectKey` not validated against stored key
- `contentType` on capture create is free-form string
- Share destination not validated at API layer for SMS/email
- No file size limits on upload
