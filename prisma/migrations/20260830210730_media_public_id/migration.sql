-- Hand-edited: Prisma's generated diff also tried to DROP INDEX
-- "Article_searchVector_idx" and DROP the generated-column expression on
-- Article.searchVector (Prisma doesn't model generated columns). Those two
-- statements were removed — searchVector is owned by the article_search_vector
-- migration and must be left alone.

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "variants",
ADD COLUMN     "publicId" TEXT;
