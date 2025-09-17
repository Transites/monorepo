# Fuzzy Search Experiments

This directory contains database testing scripts for implementing fuzzy search functionality using PostgreSQL's `pg_trgm` extension.

## Overview

The fuzzy search implementation uses PostgreSQL's trigram similarity to provide typo-tolerant search, allowing users to find content even with spelling errors (e.g., "chateu" finding "Chateaubriand").

## Test Scripts

### 1. Extension Test (`01-test-pg-trgm-extension.js`)
- ✅ Verifies `pg_trgm` extension is available
- ✅ Enables extension if not already enabled
- ✅ Tests similarity function with documented cases
- ✅ Validates similarity scores meet requirements

### 2. Index Creation (`02-create-trigram-indexes.js`)
- 📊 Creates trigram indexes for optimal performance
- 🗂️ `idx_submissions_title_trgm` on `title` column
- 🗂️ `idx_submissions_author_trgm` on `author_name` column
- 📈 Verifies index usage with EXPLAIN queries

### 3. Query Testing (`03-test-fuzzy-queries.js`)
- 🔍 Tests fuzzy search with various similarity thresholds
- ⚡ Measures query performance
- 🎯 Tests hybrid search pattern (exact + fuzzy)
- 📊 Compares performance of different search approaches

## Usage

### Run Individual Tests
```bash
# Test pg_trgm extension
node 01-test-pg-trgm-extension.js

# Create indexes
node 02-create-trigram-indexes.js

# Test queries
node 03-test-fuzzy-queries.js
```

### Run All Tests
```bash
# Run complete test suite
node run-all-tests.js
```

## Expected Results

### Similarity Scores (Threshold: 0.15)
- `"chateu" → "Chateaubriand"`: ≥ 0.143 ✅
- `"piere" → "Pierre"`: ≥ 0.313 ✅  
- `"verge" → "Verger"`: ≥ 0.161 ✅
- `"olivea" → "Olívia Guedes Penteado"`: ≥ 0.15 ✅

### Performance Targets
- ⚡ Query response time: < 200ms
- 📊 Database load increase: < 5%
- 🎯 Search success rate: > 80%

## Implementation Plan

After all tests pass:

1. **Backend Service** (`services/submission.ts`)
   - Add `listSubmissionsWithFuzzy()` method
   - Implement hybrid search (exact + fuzzy)
   - Use similarity threshold of 0.15

2. **API Controller** (`controllers/submission.ts`)
   - Add `/api/submissions/search-fuzzy` endpoint
   - Support threshold parameter
   - Return match types and relevance scores

3. **React Frontend**
   - Create `searchWithFuzzy()` function
   - Update search components
   - Add match confidence indicators

## Technical Details

### Hybrid Search Query Pattern
```sql
WITH exact_matches AS (
  SELECT *, 1.0 as relevance_score, 'exact' as match_type
  FROM submissions 
  WHERE to_tsvector('portuguese', title) @@ plainto_tsquery('portuguese', $1)
),
fuzzy_matches AS (
  SELECT *, similarity(title, $1) as relevance_score, 'fuzzy' as match_type  
  FROM submissions 
  WHERE similarity(title, $1) > 0.15
  AND id NOT IN (SELECT id FROM exact_matches)
)
SELECT * FROM exact_matches 
UNION ALL SELECT * FROM fuzzy_matches
ORDER BY relevance_score DESC;
```

### Database Connection
- **Environment**: Supabase PostgreSQL
- **Connection**: Uses existing `/backend/database/client.js`
- **Extension**: `pg_trgm` (available in Supabase)

## Cleanup

After successful implementation, this experimental directory can be deleted:

```bash
rm -rf fuzzy-search-experiments/
```

## Success Criteria

✅ All tests pass  
✅ Indexes created successfully  
✅ Query performance < 200ms  
✅ Fuzzy matches work with typos  
✅ Ready for backend implementation