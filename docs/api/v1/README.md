# API v1

Base path: `/api/v1`

All responses are wrapped in:
`{ "data": {}, "error": null, "meta": {} }`

Sections:
- `health`: health check (`/health`)
- `auth`: authentication endpoints (`/auth/*`)
- `me`: profile and onboarding preferences (`/me`)
- `internal`: internal jobs endpoints (service-token guarded)
- `broker`: brokerage linking and sync (`/broker/*`)
- `portfolio`: portfolio data (`/portfolio/*`)
- `risk`: risk radar (`/risk/*`)
- `coach`: AI coach (`/coach/*`)
- `metrics`: basic request metrics (`/metrics`)

