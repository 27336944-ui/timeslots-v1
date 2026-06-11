-- Add openid field to users table
ALTER TABLE "users" ADD COLUMN "openid" TEXT;
CREATE UNIQUE INDEX "users_openid_key" ON "users"("openid");
CREATE INDEX "users_openid_idx" ON "users"("openid");
