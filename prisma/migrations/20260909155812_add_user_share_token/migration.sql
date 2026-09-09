-- Add a public, unguessable share token for the /share/[token] job stats page
ALTER TABLE "users" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "users_shareToken_key" ON "users"("shareToken");
