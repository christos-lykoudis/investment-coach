# Broker

All endpoints are under `/api/v1/broker`.

Auth: `Authorization: Bearer <access_token>` (JWT)

## POST `/api/v1/broker/connect/session`

Creates a brokerage linking session (MVP uses SnapTrade mock).

### Request

```json
{ "provider": "snaptrade" }
```

### Response

```json
{
  "data": {
    "redirectUrl": "string",
    "providerToken": "string",
    "id": "uuid"
  },
  "error": null,
  "meta": {}
}
```

## POST `/api/v1/broker/connect/callback`

Finalizes the link using the provider token.

### Request

```json
{
  "sessionId": "uuid",
  "providerToken": "string"
}
```

### Response

```json
{
  "data": { "brokerConnectionId": "uuid" },
  "error": null,
  "meta": {}
}
```

## GET `/api/v1/broker/connections`

Lists linked institutions and sync status.

### Response

```json
{
  "data": {
    "connections": [
      {
        "id": "uuid",
        "provider": "snaptrade",
        "status": "pending|connected|disconnected",
        "lastSyncedAt": "2026-03-25T12:00:00Z"
      }
    ]
  },
  "error": null,
  "meta": {}
}
```

## DELETE `/api/v1/broker/connections/:id`

Disconnects and clears synced portfolio/risk data for that connection.

