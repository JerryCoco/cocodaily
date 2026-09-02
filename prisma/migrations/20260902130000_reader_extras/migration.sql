-- Active-users view: last time this account hit /api/auth/session
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3);

-- Feed-imported articles keep their origin URL so incremental sync can skip dupes
ALTER TABLE "Article" ADD COLUMN "sourceUrl" TEXT;

-- Forgot-password tokens (only the sha256 hash is stored)
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
