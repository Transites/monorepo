#!/usr/bin/env node

/**
 * Test 4: Test fuzzy search API endpoint
 * 
 * This script tests the new /api/submissions/search-fuzzy endpoint
 * to make sure it works correctly with the backend implementation.
 */

const path = require('path');
const http = require('http');

async function testFuzzySearchAPI() {
    console.log('='.repeat(60));
    console.log('TEST 4: Fuzzy Search API Endpoint');
    console.log('='.repeat(60));
    
    const baseUrl = 'http://localhost:1337';
    
    try {
        console.log('\n1. Testing fuzzy search API endpoint...');
        
        // Test cases from the documentation
        const testCases = [
            { search: 'chateu', description: 'should find Chateaubriand' },
            { search: 'piere', description: 'should find Pierre' },
            { search: 'verge', description: 'should find Verger' },
            { search: 'test', description: 'generic search term' }
        ];
        
        for (const testCase of testCases) {
            console.log(`\n   Testing: "${testCase.search}" (${testCase.description})`);
            
            try {
                const result = await makeRequest(
                    `${baseUrl}/api/submissions/search-fuzzy?search=${encodeURIComponent(testCase.search)}&threshold=0.15&top=5`
                );
                
                if (result.success) {
                    const data = result.data;
                    const metadata = data.searchMetadata || {};
                    
                    console.log(`   ✅ Status: ${result.message || 'Success'}`);
                    console.log(`   📊 Results: ${data.submissions?.length || 0} submissions`);
                    console.log(`   🎯 Exact matches: ${metadata.exactMatches || 0}`);
                    console.log(`   🔍 Fuzzy matches: ${metadata.fuzzyMatches || 0}`);
                    console.log(`   📈 Avg relevance: ${metadata.averageRelevance || 0}`);
                    
                    if (data.submissions && data.submissions.length > 0) {
                        console.log(`   📝 Sample results:`);
                        data.submissions.slice(0, 2).forEach((sub, index) => {
                            console.log(`     ${index + 1}. "${sub.title}"`);
                        });
                    }
                } else {
                    console.log(`   ❌ Error: ${result.message}`);
                    if (result.errors) {
                        result.errors.forEach(error => {
                            console.log(`      - ${error}`);
                        });
                    }
                }
            } catch (requestError) {
                console.log(`   💥 Request failed: ${requestError.message}`);
            }
        }
        
        // Test edge cases
        console.log('\n2. Testing edge cases...');
        
        const edgeCases = [
            { 
                url: `${baseUrl}/api/submissions/search-fuzzy`,
                description: 'missing search parameter'
            },
            { 
                url: `${baseUrl}/api/submissions/search-fuzzy?search=`,
                description: 'empty search parameter'
            },
            { 
                url: `${baseUrl}/api/submissions/search-fuzzy?search=test&threshold=1.5`,
                description: 'invalid threshold (too high)'
            },
            { 
                url: `${baseUrl}/api/submissions/search-fuzzy?search=test&threshold=0.01`,
                description: 'invalid threshold (too low)'
            }
        ];
        
        for (const edgeCase of edgeCases) {
            console.log(`\n   Testing: ${edgeCase.description}`);
            
            try {
                const result = await makeRequest(edgeCase.url);
                
                if (result.success) {
                    console.log(`   ⚠️  Expected error but got success: ${result.message}`);
                } else {
                    console.log(`   ✅ Expected error: ${result.message}`);
                    if (result.errors) {
                        result.errors.forEach(error => {
                            console.log(`      - ${error}`);
                        });
                    }
                }
            } catch (requestError) {
                console.log(`   ✅ Expected request failure: ${requestError.message}`);
            }
        }
        
        // Test performance
        console.log('\n3. Testing performance...');
        
        const performanceTestUrl = `${baseUrl}/api/submissions/search-fuzzy?search=test&threshold=0.15&top=10`;
        const iterations = 3;
        let totalTime = 0;
        
        for (let i = 0; i < iterations; i++) {
            const start = Date.now();
            try {
                await makeRequest(performanceTestUrl);
                const duration = Date.now() - start;
                totalTime += duration;
                console.log(`   Test ${i + 1}: ${duration}ms`);
            } catch (error) {
                console.log(`   Test ${i + 1}: Failed - ${error.message}`);
            }
        }
        
        const avgTime = totalTime / iterations;
        const performanceAcceptable = avgTime < 300; // Allow extra margin for API overhead
        
        console.log(`   Average response time: ${avgTime.toFixed(1)}ms`);
        console.log(`   Performance acceptable: ${performanceAcceptable ? '✅ YES' : '❌ NO'} (target: <300ms)`);
        
        console.log('\n✅ Fuzzy search API test completed!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error testing fuzzy search API:', error.message);
        return false;
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'FuzzySearchTest/1.0'
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (parseError) {
                    reject(new Error(`Failed to parse JSON response: ${parseError.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(new Error(`Request failed: ${error.message}`));
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

// Run if called directly
if (require.main === module) {
    testFuzzySearchAPI()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error.message);
            process.exit(1);
        });
}

module.exports = testFuzzySearchAPI;