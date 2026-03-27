# Coach

All endpoints are under `/api/v1/coach`.

Auth: `Authorization: Bearer <access_token>` (JWT)

## GET `/api/v1/coach/feed`

Returns a combined feed of risk nudges and behavioral coaching items.

### Response

```json
{
  "data": {
    "feed": [
      {
        "id": "uuid",
        "kind": "behavior_pattern|risk_nudge",
        "issue": "string",
        "why": "string",
        "suggestedNextStep": "string",
        "confidence": 0.78,
        "possibleDownside": "string",
        "createdAt": "2026-03-25T12:00:00Z"
      }
    ]
  },
  "error": null,
  "meta": {}
}
```

## POST `/api/v1/coach/recommendations/:id/feedback`

Submits feedback for a feed item.

### Body

```json
{
  "feedbackType": "helpful|dismissed|not_relevant",
  "notes": "optional string"
}
```

### Response

```json
{ "data": { "ok": true }, "error": null, "meta": {} }
```

## POST `/api/v1/coach/brief/generate`

Generates a weekly brief immediately and returns it.

### Response

```json
{
  "data": {
    "id": "uuid",
    "generatedAt": "2026-03-25T12:00:00Z",
    "summary": "string",
    "topChanges": ["string"],
    "risksToWatch": ["string"],
    "recommendedActions": []
  },
  "error": null,
  "meta": {}
}
```

## GET `/api/v1/coach/brief/latest`

Returns the latest generated weekly brief.

### Response

```json
{
  "data": {
    "id": "uuid",
    "generatedAt": "2026-03-25T12:00:00Z",
    "summary": "string",
    "topChanges": ["string"],
    "risksToWatch": ["string"],
    "recommendedActions": [
      {
        "action": "string",
        "why": "string",
        "confidence": 0.75,
        "possibleDownside": "string"
      }
    ]
  },
  "error": null,
  "meta": {}
}
```

