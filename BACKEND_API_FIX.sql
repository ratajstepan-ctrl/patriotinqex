-- Patriot Index API SQL fix pack
-- Run against the SAME database instance your API uses.

-- 1) Verify current database/schema
SELECT current_database() AS db, current_schema() AS schema;

-- 2) Verify votes and laws columns
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('votes', 'laws')
ORDER BY table_name, ordinal_position;

-- 3) Recommended query for /votes endpoint
-- Returns normalized row structure for frontend loader.
SELECT
  v.id,
  v.politician_id,
  v.voted,
  v.score_change,
  v.law_id,
  l.name AS law_name,
  l.date AS law_date
FROM votes v
LEFT JOIN laws l ON l.id = v.law_id
ORDER BY v.id;

-- 4) Recommended query for /laws endpoint
SELECT
  l.id,
  l.name,
  l.date,
  l.category,
  l.summary,
  l.analysis
FROM laws l
ORDER BY l.id;

-- Notes:
-- - Do NOT select 'status' unless that column exists in laws.
-- - Do NOT select 'law_name' directly from votes; join laws by law_id.
