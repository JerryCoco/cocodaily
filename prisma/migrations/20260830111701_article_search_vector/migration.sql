-- Full-text search over title + excerpt + body text.
-- Generated (STORED) tsvector column, kept in sync by Postgres automatically.
ALTER TABLE "Article"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("excerpt", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("plainText", '')), 'C')
  ) STORED;

CREATE INDEX "Article_searchVector_idx" ON "Article" USING GIN ("searchVector");
