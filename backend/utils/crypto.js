const crypto = require('crypto');

class CryptoUtils {
    // Generate secure random token
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Generate UUID v4
    generateUUID() {
        return crypto.randomUUID();
    }

    // Hash data with SHA-256
    hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // Generate secure submission token
    generateSubmissionToken() {
        const timestamp = Date.now().toString();
        const randomBytes = crypto.randomBytes(24).toString('hex');
        return this.hash(timestamp + randomBytes).substring(0, 64);
    }

    // Validate token format
    isValidTokenFormat(token) {
        return typeof token === 'string' &&
               token.length === 64 &&
               /^[a-f0-9]+$/.test(token);
    }

    // Generate request correlation ID
    generateCorrelationId() {
        return this.generateUUID();
    }

    // Create hash for caching
    createCacheKey(...parts) {
        const data = parts.join('|');
        return this.hash(data).substring(0, 16);
    }
}

module.exports = new CryptoUtils();
