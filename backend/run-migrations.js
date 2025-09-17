const MigrationRunner = require('./database/migrations/migration-runner');
require('dotenv').config();

async function runMigrations() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
        console.error('DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const runner = new MigrationRunner(databaseUrl);
    
    try {
        console.log('Running pending migrations...');
        await runner.runPendingMigrations();
        console.log('All migrations completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await runner.close();
    }
}

runMigrations();