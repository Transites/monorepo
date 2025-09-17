const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class MigrationRunner {
    constructor(databaseUrl) {
        this.pool = new Pool({ connectionString: databaseUrl });
        this.migrationsDir = __dirname;
    }

    async createMigrationsTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await this.pool.query(query);
    }

    async getAppliedMigrations() {
        const result = await this.pool.query(
            'SELECT version FROM schema_migrations ORDER BY version'
        );
        return result.rows.map(row => row.version);
    }

    async runMigration(version, direction = 'up') {
        const filename = `${version}_${direction}.sql`;
        const filepath = path.join(this.migrationsDir, filename);

        try {
            const sql = await fs.readFile(filepath, 'utf8');
            await this.pool.query('BEGIN');
            await this.pool.query(sql);

            if (direction === 'up') {
                await this.pool.query(
                    'INSERT INTO schema_migrations (version) VALUES ($1)',
                    [version]
                );
            } else {
                await this.pool.query(
                    'DELETE FROM schema_migrations WHERE version = $1',
                    [version]
                );
            }

            await this.pool.query('COMMIT');
            console.log(`Migration ${version} ${direction} completed`);
        } catch (error) {
            await this.pool.query('ROLLBACK');
            throw error;
        }
    }

    async runPendingMigrations() {
        await this.createMigrationsTable();
        const applied = await this.getAppliedMigrations();

        const migrationFiles = await fs.readdir(this.migrationsDir);
        const versions = migrationFiles
            .filter(f => f.endsWith('_up.sql'))
            .map(f => f.replace('_up.sql', ''))
            .sort();

        for (const version of versions) {
            if (!applied.includes(version)) {
                await this.runMigration(version, 'up');
            }
        }
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = MigrationRunner;
