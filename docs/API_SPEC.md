# API Specification

Base URL: `/api/v1`

## Devices

### POST /devices/pair

Request:
```json
{ "pairingCode": "WEDDING2025", "deviceName": "Booth-1", "deviceModel": "Tab S9 FE+" }
```

Response:
```json
{ "deviceId": "uuid", "accessToken": "token" }
```

## Events

### GET /events
List all events.

### POST /events
Create wedding event. Wedding fields live in `config` JSON.

### GET /events/{eventId}/config
Server-authoritative event config for device pull.

## Captures

### POST /captures
Headers: `Authorization: Bearer {accessToken}`

Request:
```json
{
  "eventId": "uuid",
  "captureType": "PHOTO",
  "idempotencyKey": "uuid",
  "deviceId": "uuid",
  "contentType": "image/jpeg"
}
```

Response:
```json
{
  "captureId": "uuid",
  "uploadUrl": "https://...presigned...",
  "objectKey": "tenant/.../capture/....jpg"
}
```

### POST /captures/{captureId}/complete
Idempotent completion after R2 PUT.

## Shares

### POST /shares
Queue SMS share (Twilio when configured).

## Analytics

### POST /analytics/batch
Optional batch metrics from device.
