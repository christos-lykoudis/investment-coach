import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const loadEnvFile = (): void => {
  const candidatePaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "apps/api/.env"),
    path.resolve(__dirname, "../../.env")
  ];

  for (const envPath of candidatePaths) {
    if (!fs.existsSync(envPath)) continue;
    dotenv.config({ path: envPath });
    return;
  }
};

loadEnvFile();

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const requireEnvInProd = (name: string, fallback: string): string => {
  if (process.env.NODE_ENV === 'production') return requireEnv(name);
  return process.env[name] ?? fallback;
};

export const env = {
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  jwtAccessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? '900'),
  jwtRefreshTtlSeconds: Number(
    process.env.JWT_REFRESH_TTL_SECONDS ?? String(60 * 60 * 24 * 30),
  ),
  serviceToken: requireEnv('SERVICE_TOKEN'),
  brokerTokenEncryptionKey: requireEnvInProd(
    'BROKER_TOKEN_ENCRYPTION_KEY',
    'dev-only-broker-token-key-change-in-production',
  ),
  alphaVantageApiKey: process.env.ALPHAVANTAGE_API_KEY ?? null,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ? Number(process.env.PORT) : 3001,
};
