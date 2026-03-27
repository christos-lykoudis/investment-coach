# Me

All endpoints are under `/api/v1/me`.

Auth: `Authorization: Bearer <access_token>` (JWT)

## GET `/api/v1/me`

Returns the user profile and onboarding completion state.

### Response

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "onboardingCompleted": false,
    "preferences": null
  },
  "error": null,
  "meta": {}
}
```

## PUT `/api/v1/me/preferences`

Updates onboarding preferences.

### Request

```json
{
  "timeHorizon": "5_10_years",
  "riskTolerance": "moderate",
  "volatilityComfort": "medium",
  "goalType": "wealth_growth",
  "experienceLevel": "intermediate"
}
```

### Response

```json
{
  "data": {
    "timeHorizon": "5_10_years",
    "riskTolerance": "moderate",
    "volatilityComfort": "medium",
    "goalType": "wealth_growth",
    "experienceLevel": "intermediate"
  },
  "error": null,
  "meta": {}
}
```

