# Internal Jobs

Base path: `/api/v1/internal/jobs`

Auth:
- Header `x-service-token: <SERVICE_TOKEN>`
- Optional `INTERNAL_IP_ALLOWLIST` environment variable (comma-separated list of allowed IPs).

## POST `/api/v1/internal/jobs/sync-broker`

Runs sync immediately for a broker connection.

### Body

```json
{ "brokerConnectionId": "uuid" }
```

## POST `/api/v1/internal/jobs/recompute-risk`

MVP implementation: risk is recomputed as part of `sync-broker`, so this runs sync immediately.

### Body

```json
{ "brokerConnectionId": "uuid" }
```

## POST `/api/v1/internal/jobs/generate-brief`

Generates weekly brief immediately for a user.

### Body

```json
{ "userId": "uuid" }
```

