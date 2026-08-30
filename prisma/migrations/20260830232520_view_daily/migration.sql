-- Hand-edited: removed Prisma's spurious `DROP INDEX Article_searchVector_idx`
-- and `ALTER COLUMN searchVector DROP DEFAULT` (it doesn't model generated cols).

-- CreateTable
CREATE TABLE "ViewDaily" (
    "articleId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ViewDaily_pkey" PRIMARY KEY ("articleId","day")
);

-- CreateIndex
CREATE INDEX "ViewDaily_day_idx" ON "ViewDaily"("day");

-- AddForeignKey
ALTER TABLE "ViewDaily" ADD CONSTRAINT "ViewDaily_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
