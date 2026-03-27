# Auth

All endpoints are under `/api/v1/auth`.

## POST `/api/v1/auth/signup`

Creates a user and returns access/refresh tokens.

### Request

```json
{
  "email": "user@example.com",
  "password": "a_long_enough_password"
}
```

### Response

```json
{
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  },
  "error": null,
  "meta": {}
}
```

## POST `/api/v1/auth/login`

Validates credentials and returns access/refresh tokens.

### Request

```json
{
  "email": "user@example.com",
  "password": "a_long_enough_password"
}
```

### Response

```json
{
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  },
  "error": null,
  "meta": {}
}
```

