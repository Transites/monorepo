const { Pool } = require('pg');
const config = require('../config/services');

class DatabaseClient {
    constructor() {
        this.pool = new Pool({
            connectionString: config.database.url,
            ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
            min: config.database.poolMin || 2,
            max: config.database.poolMax || 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected database error:', err);
        });
    }

    async query(text, params) {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log(`Query executed in ${duration}ms:`, { text, duration, rows: result.rowCount });
            return result;
        } catch (error) {
            console.error('Database query error:', { text, error: error.message });
            throw error;
        }
    }

    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Helper methods para operações comuns
    async findById(table, id) {
        const result = await this.query(
            `SELECT * FROM ${table} WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    async findByAdminEmail(table, email) {
        const result = await this.query(
            `SELECT * FROM ${table} WHERE email = $1`,
            [email]
        );
        return result.rows[0];
    }

    async findByAuthorEmail(table, email) {
        const result = await this.query(
            `SELECT * FROM ${table} WHERE author_email = $1`,
            [email]
        );
        return result.rows;
    }

    async findByToken(token) {
        const result = await this.query(
            'SELECT * FROM submissions WHERE token = $1',
            [token]
        );
        return result.rows[0];
    }

    async create(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.query(
            `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async update(table, id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

        const result = await this.query(
            `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        return result.rows[0];
    }

    async delete(table, id) {
        const result = await this.query(
            `DELETE FROM ${table} WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    async healthCheck() {
        try {
            await this.query('SELECT 1');
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (error) {
            return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
        }
    }

    async cleanupExpiredTokens() {
        const result = await this.query(`
            UPDATE submissions
            SET status = 'EXPIRED'
            WHERE status IN ('DRAFT', 'CHANGES_REQUESTED')
            AND expires_at < CURRENT_TIMESTAMP
            RETURNING id, token
        `);
        return result.rows;
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = new DatabaseClient();
