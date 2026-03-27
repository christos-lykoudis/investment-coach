-- AlterTable
ALTER TABLE "broker_connections" ADD COLUMN     "authExpiresAt" TIMESTAMP(3),
ADD COLUMN     "encryptedAccessToken" TEXT,
ADD COLUMN     "encryptedRefreshToken" TEXT,
ADD COLUMN     "externalUserId" TEXT,
ADD COLUMN     "lastSyncAttemptAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncStatus" TEXT,
ADD COLUMN     "providerMetadata" JSONB,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "syncCursor" TEXT;

-- CreateTable
CREATE TABLE "broker_sync_runs" (
    "id" TEXT NOT NULL,
    "brokerConnectionId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "broker_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "broker_sync_runs_brokerConnectionId_startedAt_idx" ON "broker_sync_runs"("brokerConnectionId", "startedAt");

-- CreateIndex
CREATE INDEX "broker_connections_status_lastSyncStatus_idx" ON "broker_connections"("status", "lastSyncStatus");

-- AddForeignKey
ALTER TABLE "broker_sync_runs" ADD CONSTRAINT "broker_sync_runs_brokerConnectionId_fkey" FOREIGN KEY ("brokerConnectionId") REFERENCES "broker_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
