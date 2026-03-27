process.env.ENABLE_WORKERS = "false";
process.env.SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? "test_service_token";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test_access_secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test_refresh_secret";
process.env.JWT_ACCESS_TTL_SECONDS = process.env.JWT_ACCESS_TTL_SECONDS ?? "900";
process.env.JWT_REFRESH_TTL_SECONDS = process.env.JWT_REFRESH_TTL_SECONDS ?? String(60 * 60 * 24);
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/investment_coach?schema=public";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

