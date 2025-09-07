#!/usr/bin/env node

// Simple script to fix content_html for all articles
const path = require('path');

// Add the project root to the path so we can import our modules
require('ts-node').register({
    project: path.join(__dirname, '..', 'tsconfig.json')
});

async function main() {
    console.log('🔧 Starting content_html fix process...');
    
    try {
        const { default: contentHtmlFixer } = await import('../utils/fixContentHtml');
        
        // Run the fix
        const result = await contentHtmlFixer.fixAllArticles();
        
        console.log('\n📊 Fix Results:');
        console.log(`✅ Total articles processed: ${result.total}`);
        console.log(`✅ Successfully updated: ${result.updated}`);
        console.log(`❌ Failed: ${result.failed}`);
        
        if (result.errors.length > 0) {
            console.log('\n❌ Errors:');
            result.errors.forEach(error => {
                console.log(`   - ${error.title}: ${error.error}`);
            });
        }
        
        console.log('\n🎉 Content_html fix process completed!');
        
        // Test the Chateaubriand article specifically
        if (result.updated > 0) {
            console.log('\n🧪 Testing Chateaubriand article...');
            const verification = await contentHtmlFixer.verifyFix('72e21d21-78ca-43c5-9675-3dfaa4c9ee5b');
            console.log('Chateaubriand verification:', verification);
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error running fix:', error.message);
        process.exit(1);
    }
}

main();