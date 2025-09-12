#!/usr/bin/env node

/**
 * CORS Security Test Script
 * Tests that the backend correctly blocks external origins and allows only the frontend
 */

console.log('🔒 CORS Security Test\n');

const tests = [
    {
        name: 'Malicious Origin (should be blocked)',
        origin: 'http://malicious-site.com',
        expectAllowOrigin: false
    },
    {
        name: 'Another Malicious Origin (should be blocked)',
        origin: 'http://evil.com',
        expectAllowOrigin: false
    },
    {
        name: 'Frontend Origin Port 8080 (should be allowed)',
        origin: 'http://localhost:8080',
        expectAllowOrigin: true
    },
    {
        name: 'Frontend Origin Port 8081 (should be allowed)',
        origin: 'http://localhost:8081',
        expectAllowOrigin: true
    }
];

async function testCorsOrigin(origin, expectAllowOrigin) {
    try {
        const response = await fetch('http://localhost:1337/api/health', {
            method: 'GET',
            headers: {
                'Origin': origin
            }
        });
        
        const allowOriginHeader = response.headers.get('Access-Control-Allow-Origin');
        
        if (expectAllowOrigin) {
            if (allowOriginHeader === origin) {
                return { success: true, message: `✅ Origin allowed as expected` };
            } else {
                return { success: false, message: `❌ Origin should be allowed but was blocked` };
            }
        } else {
            if (!allowOriginHeader) {
                return { success: true, message: `✅ Origin blocked as expected` };
            } else {
                return { success: false, message: `❌ Origin should be blocked but was allowed: ${allowOriginHeader}` };
            }
        }
    } catch (error) {
        return { success: false, message: `❌ Network error: ${error.message}` };
    }
}

async function runTests() {
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        console.log(`Testing: ${test.name}`);
        console.log(`Origin: ${test.origin}`);
        
        const result = await testCorsOrigin(test.origin, test.expectAllowOrigin);
        console.log(result.message);
        
        if (result.success) {
            passed++;
        }
        
        console.log(''); // Empty line for readability
    }
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All CORS security tests passed! Your server is properly secured.');
    } else {
        console.log('⚠️  Some tests failed. Please review your CORS configuration.');
    }
    
    return passed === total;
}

// Check if server is running first
fetch('http://localhost:1337/api/health')
    .then(() => {
        console.log('✅ Backend server is running on port 1337\n');
        return runTests();
    })
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.log('❌ Backend server is not running on port 1337');
        console.log('Please start the server first with: npm run dev');
        process.exit(1);
    });