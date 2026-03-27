# Investment Coach

Investment Coach is an AI-powered portfolio coaching app that helps retail investors understand concentration risk, volatility, and behavior patterns in plain English.

## Problem It Solves

Most investing tools show raw performance data but do not explain risk trade-offs or decision quality clearly. This project aims to close that gap by combining:

- portfolio and position snapshots
- risk scoring and alerting
- educational coaching recommendations
- a simple dashboard for ongoing decision support

The goal is not to provide direct trade instructions, but to help users make more consistent, risk-aware decisions.

## Project Structure

This repository is a monorepo organized by application and shared package boundaries:

- `apps/web` - Next.js frontend for onboarding, dashboard, risk, coaching, and settings flows
- `apps/api` - NestJS backend for auth, broker sync, portfolio/risk APIs, and AI coaching generation
- `packages/shared` - shared cross-app types/utilities (for example API envelope contracts)
- `docs` - API and UI component documentation

Key backend domains live under `apps/api/src`:

- `auth`, `me` - identity and user profile/preferences
- `broker`, `workers` - broker connection flows and sync jobs
- `portfolio`, `risk`, `coach` - portfolio retrieval, risk analysis, and coaching outputs
- `internal`, `metrics`, `health` - operational endpoints and observability

## Dev

Use `pnpm dev` to start both the API and web apps.

## Docs

See `docs/`.
