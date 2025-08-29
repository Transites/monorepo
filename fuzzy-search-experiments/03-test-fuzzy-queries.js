#!/usr/bin/env node

/**
 * Test 3: Test fuzzy search queries
 * 
 * This script:
 * - Tests fuzzy search on existing submissions
 * - Compares exact vs fuzzy search results
 * - Tests the hybrid search pattern from documentation
 * - Measures query performance
 */

const path = require('path');
const db = require(path.join(__dirname, '../backend/database/client'));

async function testFuzzyQueries() {
    console.log('='.repeat(60));
    console.log('TEST 3: Fuzzy Search Queries');
    console.log('='.repeat(60));
    
    try {
        // 1. Get sample data for testing
        console.log('\n1. Checking available submissions for testing...');
        const sampleSubmissions = await db.query(`
            SELECT id, title, author_name, status
            FROM submissions 
            WHERE status = 'PUBLISHED'
            ORDER BY created_at DESC
            LIMIT 10
        `);
        
        console.log(`   Found ${sampleSubmissions.rows.length} published submissions:`);
        sampleSubmissions.rows.forEach((sub, index) => {
            console.log(`   ${index + 1}. "${sub.title}" by ${sub.author_name}`);
        });
        
        if (sampleSubmissions.rows.length === 0) {
            console.log('   ⚠️  No published submissions found. Testing with hypothetical data.');
        }
        
        // 2. Test similarity function with various thresholds
        console.log('\n2. Testing similarity thresholds...');
        const testQueries = [
            'chateu',
            'piere', 
            'verge',
            'olivea'
        ];
        
        const thresholds = [0.1, 0.15, 0.2, 0.3];
        
        for (const query of testQueries) {
            console.log(`\n   Query: "${query}"`);
            
            for (const threshold of thresholds) {
                const start = Date.now();
                const result = await db.query(`
                    SELECT 
                        title,
                        author_name,
                        similarity(title, $1) as title_similarity,
                        similarity(author_name, $1) as author_similarity,
                        GREATEST(similarity(title, $1), similarity(author_name, $1)) as max_similarity
                    FROM submissions 
                    WHERE similarity(title, $1) > $2 
                       OR similarity(author_name, $1) > $2
                    ORDER BY max_similarity DESC
                    LIMIT 5
                `, [query, threshold]);
                
                const duration = Date.now() - start;
                
                console.log(`     Threshold ${threshold}: ${result.rows.length} results (${duration}ms)`);
                result.rows.forEach((row, index) => {
                    const titleSim = parseFloat(row.title_similarity).toFixed(3);
                    const authorSim = parseFloat(row.author_similarity).toFixed(3);
                    console.log(`       ${index + 1}. "${row.title}" (title: ${titleSim}, author: ${authorSim})`);
                });
            }
        }
        
        // 3. Test hybrid search pattern (exact + fuzzy)
        console.log('\n3. Testing hybrid search pattern...');
        
        const hybridTestQuery = sampleSubmissions.rows.length > 0 
            ? sampleSubmissions.rows[0].title.substring(0, 5) // Use part of first title
            : 'test';
            
        console.log(`   Testing with query: "${hybridTestQuery}"`);
        
        const hybridStart = Date.now();
        const hybridResult = await db.query(`
            WITH exact_matches AS (
                SELECT 
                    id, title, author_name,
                    1.0 as relevance_score, 
                    'exact' as match_type
                FROM submissions 
                WHERE to_tsvector('portuguese', title || ' ' || COALESCE(author_name, '')) 
                      @@ plainto_tsquery('portuguese', $1)
                AND status = 'PUBLISHED'
            ),
            fuzzy_matches AS (
                SELECT 
                    id, title, author_name,
                    GREATEST(similarity(title, $1), similarity(author_name, $1)) as relevance_score,
                    'fuzzy' as match_type
                FROM submissions 
                WHERE (similarity(title, $1) > 0.15 OR similarity(author_name, $1) > 0.15)
                AND id NOT IN (SELECT id FROM exact_matches)
                AND status = 'PUBLISHED'
            )
            SELECT * FROM exact_matches 
            UNION ALL 
            SELECT * FROM fuzzy_matches
            ORDER BY relevance_score DESC, match_type
            LIMIT 10
        `, [hybridTestQuery]);
        
        const hybridDuration = Date.now() - hybridStart;
        
        console.log(`   Hybrid search results (${hybridDuration}ms):`);
        hybridResult.rows.forEach((row, index) => {
            const score = parseFloat(row.relevance_score).toFixed(3);
            const badge = row.match_type === 'exact' ? '🎯' : '🔍';
            console.log(`   ${badge} ${index + 1}. "${row.title}" by ${row.author_name} (${score})`);
        });
        
        // 4. Performance comparison: exact vs fuzzy vs hybrid
        console.log('\n4. Performance comparison...');
        
        const testQuery = 'test';
        const iterations = 3;
        
        // Exact search
        let exactTotal = 0;
        for (let i = 0; i < iterations; i++) {
            const start = Date.now();
            await db.query(`
                SELECT id, title, author_name
                FROM submissions 
                WHERE to_tsvector('portuguese', title || ' ' || COALESCE(author_name, '')) 
                      @@ plainto_tsquery('portuguese', $1)
                AND status = 'PUBLISHED'
                LIMIT 10
            `, [testQuery]);
            exactTotal += Date.now() - start;
        }
        const exactAvg = exactTotal / iterations;
        
        // Fuzzy search
        let fuzzyTotal = 0;
        for (let i = 0; i < iterations; i++) {
            const start = Date.now();
            await db.query(`
                SELECT id, title, author_name,
                       GREATEST(similarity(title, $1), similarity(author_name, $1)) as similarity
                FROM submissions 
                WHERE similarity(title, $1) > 0.15 OR similarity(author_name, $1) > 0.15
                AND status = 'PUBLISHED'
                ORDER BY similarity DESC
                LIMIT 10
            `, [testQuery]);
            fuzzyTotal += Date.now() - start;
        }
        const fuzzyAvg = fuzzyTotal / iterations;
        
        console.log(`   Exact search average: ${exactAvg.toFixed(1)}ms`);
        console.log(`   Fuzzy search average: ${fuzzyAvg.toFixed(1)}ms`);
        console.log(`   Performance ratio: ${(fuzzyAvg / exactAvg).toFixed(1)}x`);
        
        const performanceAcceptable = fuzzyAvg < 200; // Target: <200ms
        console.log(`   Performance acceptable: ${performanceAcceptable ? '✅ YES' : '❌ NO'} (target: <200ms)`);
        
        console.log('\n✅ Fuzzy search queries test completed!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error testing fuzzy queries:', error.message);
        console.error(error.stack);
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    testFuzzyQueries()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .finally(() => {
            db.close();
        });
}

module.exports = testFuzzyQueries;