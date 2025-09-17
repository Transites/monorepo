#!/usr/bin/env node

/**
 * Test 2: Create trigram indexes for fuzzy search
 * 
 * This script:
 * - Checks existing indexes on submissions table
 * - Creates trigram indexes for title and author_name
 * - Verifies indexes were created successfully
 * - Tests index performance with EXPLAIN
 */

const path = require('path');
const db = require(path.join(__dirname, '../backend/database/client'));

async function createTrigramIndexes() {
    console.log('='.repeat(60));
    console.log('TEST 2: Create Trigram Indexes');
    console.log('='.repeat(60));
    
    try {
        // 1. Check current indexes
        console.log('\n1. Checking existing indexes on submissions table...');
        const existingIndexes = await db.query(`
            SELECT 
                indexname, 
                indexdef,
                schemaname,
                tablename
            FROM pg_indexes 
            WHERE tablename = 'submissions'
            ORDER BY indexname
        `);
        
        console.log(`   Found ${existingIndexes.rows.length} existing indexes:`);
        existingIndexes.rows.forEach(idx => {
            const isGin = idx.indexdef.includes('gin');
            const isTrgm = idx.indexdef.includes('gin_trgm_ops');
            const marker = isTrgm ? '🔍' : isGin ? '📖' : '🗂️';
            console.log(`   ${marker} ${idx.indexname}`);
        });
        
        // 2. Check if trigram indexes already exist
        const trgramIndexes = existingIndexes.rows.filter(idx => 
            idx.indexdef.includes('gin_trgm_ops')
        );
        
        if (trgramIndexes.length > 0) {
            console.log('\n   ✅ Trigram indexes already exist:');
            trgramIndexes.forEach(idx => {
                console.log(`      - ${idx.indexname}`);
            });
        }
        
        // 3. Create trigram indexes if they don't exist
        const indexesToCreate = [
            {
                name: 'idx_submissions_title_trgm',
                column: 'title',
                exists: trgramIndexes.some(idx => idx.indexname.includes('title_trgm'))
            },
            {
                name: 'idx_submissions_author_trgm', 
                column: 'author_name',
                exists: trgramIndexes.some(idx => idx.indexname.includes('author_trgm'))
            }
        ];
        
        console.log('\n2. Creating trigram indexes...');
        
        for (const index of indexesToCreate) {
            if (index.exists) {
                console.log(`   ⏭️  ${index.name} already exists, skipping`);
                continue;
            }
            
            console.log(`   📝 Creating ${index.name}...`);
            
            try {
                // Use CONCURRENTLY to avoid locking the table
                await db.query(`
                    CREATE INDEX CONCURRENTLY ${index.name} 
                    ON submissions 
                    USING gin (${index.column} gin_trgm_ops)
                `);
                console.log(`   ✅ ${index.name} created successfully`);
            } catch (indexError) {
                if (indexError.message.includes('already exists')) {
                    console.log(`   ⏭️  ${index.name} already exists`);
                } else {
                    console.error(`   ❌ Failed to create ${index.name}:`, indexError.message);
                }
            }
        }
        
        // 4. Verify indexes were created
        console.log('\n3. Verifying trigram indexes...');
        const finalIndexCheck = await db.query(`
            SELECT 
                indexname, 
                indexdef
            FROM pg_indexes 
            WHERE tablename = 'submissions' 
            AND indexdef ILIKE '%gin_trgm_ops%'
            ORDER BY indexname
        `);
        
        console.log(`   Found ${finalIndexCheck.rows.length} trigram indexes:`);
        finalIndexCheck.rows.forEach(idx => {
            console.log(`   ✅ ${idx.indexname}`);
        });
        
        // 5. Test index usage with EXPLAIN
        console.log('\n4. Testing index usage with EXPLAIN...');
        
        const explainResult = await db.query(`
            EXPLAIN (FORMAT JSON) 
            SELECT id, title, author_name 
            FROM submissions 
            WHERE similarity(title, $1) > 0.15
            ORDER BY similarity(title, $1) DESC
            LIMIT 5
        `, ['chateu']);
        
        const plan = explainResult.rows[0]['QUERY PLAN'][0];
        const usesIndex = JSON.stringify(plan).includes('gin_trgm');
        
        console.log(`   Index usage in similarity query: ${usesIndex ? '✅ YES' : '❌ NO'}`);
        if (usesIndex) {
            console.log('   📊 Query will use trigram indexes for optimal performance');
        }
        
        console.log('\n✅ Trigram indexes setup completed!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error creating trigram indexes:', error.message);
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    createTrigramIndexes()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .finally(() => {
            db.close();
        });
}

module.exports = createTrigramIndexes;