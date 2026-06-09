# Database Schema

## Android (Room + SQLCipher)

| Table | Key fields |
|-------|------------|
| events | eventId, eventType, configJson, serverVersion, isActive |
| captures | captureId, idempotencyKey, syncStatus, localMediaPath, compositePath |
| share_intents | shareId, captureId, channel, destination, idempotencyKey, status |
| print_jobs | jobId, captureId, status, retryCount |
| consent_records | sessionId, eventId, accepted, timestamp |
| upload_queue | queueId, captureId, idempotencyKey, status, retryCount |
| analytics | analyticsId, eventType, properties, uploadStatus |

## PostgreSQL (backend)

| Table | Purpose |
|-------|---------|
| devices | Paired tablets, access tokens |
| events | Event config (jsonb), wedding fields in config |
| captures | Metadata + R2 object keys, idempotency |
| shares | SMS/share queue |

Media bytes stored in R2 only — never in Postgres.
