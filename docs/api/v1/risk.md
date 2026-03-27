# Risk Radar

All endpoints are under `/api/v1/risk`.

Auth: `Authorization: Bearer <access_token>` (JWT)

## GET `/api/v1/risk/snapshot`

Returns latest risk metrics.

### Response

```json
{
  "data": {
    "riskSnapshotId": "uuid",
    "createdAt": "2026-03-25T12:00:00Z",
    "concentrationScore": 0.0,
    "sectorConcentration": 0.0,
    "topHoldingWeight": 0.0,
    "volatilityEstimate": 0.0,
    "drawdownEstimate": 0.0,
    "diversificationScore": 0.0
  },
  "error": null,
  "meta": {}
}
```

## GET `/api/v1/risk/history`

Trend chart data for risk metrics.

### Query

- `range`: `30d` | `90d` | `1y` (default: `90d`)

### Response

```json
{
  "data": {
    "range": "90d",
    "series": [
      {
        "createdAt": "2026-01-01T00:00:00Z",
        "concentrationScore": 0.0
      }
    ]
  },
  "error": null,
  "meta": {}
}
```

## GET `/api/v1/risk/alerts`

Returns risk alerts for the latest risk snapshot.

### Response

```json
{
  "data": {
    "riskSnapshotId": "uuid",
    "alerts": [
      {
        "id": "uuid",
        "type": "single_asset_concentration",
        "severity": "high",
        "title": "Single holding concentration is high",
        "description": "string",
        "confidence": 0.93,
        "assumptions": ["string"],
        "createdAt": "2026-03-25T12:00:00Z",
        "possibleDownside": "string"
      }
    ]
  },
  "error": null,
  "meta": {}
}
```

