# Portfolio

All endpoints are under `/api/v1/portfolio`.

Auth: `Authorization: Bearer <access_token>` (JWT)

## GET `/api/v1/portfolio/overview`

Returns total portfolio value and summary metrics.

### Response

```json
{
  "data": {
    "totalValue": 12345.67,
    "totalPnL": 123.45,
    "cash": 1234.56,
    "accountCount": 1,
    "asOf": "2026-03-25T12:00:00Z"
  },
  "error": null,
  "meta": {}
}
```

## GET `/api/v1/portfolio/positions`

Paginated list of current positions for the latest synced portfolio.

### Query

- `page`: number (default `1`)
- `pageSize`: number (default `20`)

### Response

```json
{
  "data": {
    "positions": [
      { "symbol": "AAPL", "weight": 0.21, "sector": "Tech", "unrealizedPnL": 120.3 }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 8
  },
  "error": null,
  "meta": {}
}
```

## GET `/api/v1/portfolio/transactions`

Returns transactions for behavior analysis.

### Query

- `from`: ISO date string
- `to`: ISO date string

### Response

```json
{
  "data": {
    "transactions": [
      {
        "date": "2026-02-01T00:00:00Z",
        "symbol": "NVDA",
        "transactionType": "BUY",
        "amount": 123.45,
        "description": "BUY NVDA"
      }
    ]
  },
  "error": null,
  "meta": {}
}
```

## POST `/api/v1/portfolio/sync`

Runs an immediate sync for the most recently connected brokerage.

MVP rate limit: one sync per connection per 60 seconds.

### Response

```json
{
  "data": {
    "ok": true,
    "queued": false,
    "brokerConnectionId": "uuid",
    "requestedAt": "2026-03-25T12:00:00Z"
  },
  "error": null,
  "meta": {}
}
```

