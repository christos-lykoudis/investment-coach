# RequireAuth

Location: `apps/web/components/RequireAuth.tsx`

Client-side token gate used by authenticated MVP pages.

## Behavior

- Checks for an `accessToken` in `localStorage`.
- If missing, redirects to `/auth/login`.

