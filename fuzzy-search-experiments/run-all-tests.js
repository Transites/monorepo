#!/usr/bin/env node

/**
 * Run all fuzzy search tests in sequence
 * 
 * This master script runs all database tests:
 * 1. Test pg_trgm extension
 * 2. Create trigram indexes  
 * 3. Test fuzzy queries
 * 
 * Usage: node run-all-tests.js
 */

const path = require('path');

async function runAllTests() {
    console.log('🚀 Starting Fuzzy Search Database Tests');
    console.log('=' .repeat(80));
    
    const tests = [
        { name: 'pg_trgm Extension Test', file: './01-test-pg-trgm-extension.js' },
        { name: 'Trigram Indexes Creation', file: './02-create-trigram-indexes.js' },
        { name: 'Fuzzy Query Testing', file: './03-test-fuzzy-queries.js' }
    ];
    
    let allPassed = true;
    
    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        console.log(`\n📋 Running Test ${i + 1}/${tests.length}: ${test.name}`);
        
        try {
            const testFunction = require(test.file);
            const result = await testFunction();
            
            if (result) {
                console.log(`✅ Test ${i + 1} PASSED: ${test.name}`);
            } else {
                console.log(`❌ Test ${i + 1} FAILED: ${test.name}`);
                allPassed = false;
            }
        } catch (error) {
            console.error(`💥 Test ${i + 1} ERROR: ${test.name}`);
            console.error(`   ${error.message}`);
            allPassed = false;
        }
        
        // Add separator between tests
        if (i < tests.length - 1) {
            console.log('\n' + '-'.repeat(60));
        }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('🏁 FINAL RESULTS');
    console.log('='.repeat(80));
    
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('   The database is ready for fuzzy search implementation.');
        console.log('\nNext steps:');
        console.log('   1. Implement listSubmissionsWithFuzzy() in submission service');
        console.log('   2. Add /api/submissions/search-fuzzy endpoint');
        console.log('   3. Update React frontend with fuzzy search');
    } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('   Please review the error messages above and fix issues before proceeding.');
    }
    
    console.log('='.repeat(80));
    
    return allPassed;
}

// Run if called directly
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error running tests:', error.message);
            process.exit(1);
        });
}

module.exports = runAllTests;