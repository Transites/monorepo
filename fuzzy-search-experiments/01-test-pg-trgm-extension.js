#!/usr/bin/env node

/**
 * Test 1: Verify pg_trgm extension is available and working
 * 
 * This script tests:
 * - If pg_trgm extension exists
 * - If not, tries to enable it
 * - Tests basic similarity function
 * - Tests the specific use cases from the documentation
 */

const path = require('path');
const db = require(path.join(__dirname, '../backend/database/client'));

async function testPgTrgramExtension() {
    console.log('='.repeat(60));
    console.log('TEST 1: PostgreSQL pg_trgm Extension');
    console.log('='.repeat(60));
    
    try {
        // 1. Check if pg_trgm extension exists
        console.log('\n1. Checking pg_trgm extension status...');
        const extensionResult = await db.query(
            "SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_trgm'"
        );
        
        if (extensionResult.rows.length > 0) {
            console.log('✅ pg_trgm extension is already enabled');
            console.log(`   Version: ${extensionResult.rows[0].extversion}`);
        } else {
            console.log('❌ pg_trgm extension is not enabled');
            console.log('   Attempting to enable...');
            
            try {
                await db.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
                console.log('✅ pg_trgm extension enabled successfully');
            } catch (enableError) {
                console.error('❌ Failed to enable pg_trgm extension:', enableError.message);
                throw enableError;
            }
        }
        
        // 2. Test similarity function with documented test cases
        console.log('\n2. Testing similarity function with documented cases...');
        const testCases = [
            { search: 'chateu', target: 'Chateaubriand', expectedMin: 0.15 },
            { search: 'piere', target: 'Pierre', expectedMin: 0.15 },
            { search: 'verge', target: 'Verger', expectedMin: 0.15 },
            { search: 'olivea', target: 'Olívia Guedes Penteado', expectedMin: 0.15 }
        ];
        
        console.log('   Similarity scores (threshold: 0.15):');
        let allTestsPassed = true;
        
        for (const testCase of testCases) {
            const result = await db.query(
                'SELECT similarity($1, $2) as score',
                [testCase.search, testCase.target]
            );
            
            const score = parseFloat(result.rows[0].score);
            const passes = score >= testCase.expectedMin;
            const status = passes ? '✅ PASS' : '❌ FAIL';
            
            console.log(`   "${testCase.search}" → "${testCase.target}": ${score.toFixed(3)} ${status}`);
            
            if (!passes) {
                allTestsPassed = false;
            }
        }
        
        // 3. Test available similarity operators
        console.log('\n3. Testing similarity operators...');
        
        // Test % operator (equivalent to similarity() >= 0.3)
        const operatorTest = await db.query(
            "SELECT 'chateu' % 'Chateaubriand' as matches_default_threshold"
        );
        console.log(`   'chateu' % 'Chateaubriand': ${operatorTest.rows[0].matches_default_threshold}`);
        
        // 4. Show current similarity threshold
        const thresholdResult = await db.query('SHOW pg_trgm.similarity_threshold');
        console.log(`   Current similarity threshold: ${thresholdResult.rows[0].pg_trgm_similarity_threshold}`);
        
        console.log('\n✅ pg_trgm extension test completed successfully!');
        console.log(`   Tests passed: ${allTestsPassed ? 'ALL' : 'SOME FAILED'}`);
        
        return allTestsPassed;
        
    } catch (error) {
        console.error('❌ Error during pg_trgm test:', error.message);
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    testPgTrgramExtension()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .finally(() => {
            db.close();
        });
}

module.exports = testPgTrgramExtension;