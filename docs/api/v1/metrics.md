# Metrics

## GET `/api/v1/metrics`

Returns basic in-memory request counters and average latency.

### Response

```json
{
  "data": {
    "requestsTotal": 0,
    "avgLatencyMs": 0,
    "statusCounts": { "200": 0 }
  },
  "error": null,
  "meta": {}
}
```

