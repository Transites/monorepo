/**
 * Configuration for external services
 * This module loads and validates environment variables for Supabase, Resend, and Cloudinary
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file if not already loaded
if (!process.env.DATABASE_URL) {
    dotenv.config({path: path.resolve(process.cwd(), '.env')});
}

/**
 * Validates that required environment variables are present
 * @param {Array<string>} requiredVars - Array of required environment variable names
 * @param {string} serviceName - Name of the service for error messages
 * @throws {Error} If any required variables are missing
 */
const validateRequiredVars = (requiredVars, serviceName) => {
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables for ${serviceName}: ${missingVars.join(', ')}`);
    }
};

// Validate required environment variables for each service
const validateConfig = () => {
    validateRequiredVars(['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'], 'Supabase');
    validateRequiredVars(['CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_CLOUD_NAME'], 'Storage');
};

// Validate configuration on module load
validateConfig();

const smtpPrimaryUser = process.env.GMAIL_SMTP_USER_PRIMARY || 'enciclopedia.iea.usp@gmail.com';
const smtpSecondaryUser = process.env.GMAIL_SMTP_USER_SECONDARY || 'enciclopediaprojeto@gmail.com';

// Export configuration organized by service
module.exports = {
    database: {
        url: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true',
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
    },
    email: {
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.FROM_EMAIL || smtpPrimaryUser,
        smtpFromEmail: process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || smtpPrimaryUser,
        resendFromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@enciclopedia.iea.usp.br',
        fromName: process.env.FROM_NAME || 'Enciclopédia Transitos',
        replyTo: process.env.REPLY_TO || 'contato@enciclopedia.iea.usp.br',
        smtp: {
            enabled: process.env.SMTP_ENABLED !== 'false',
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            accounts: [
                {
                    user: smtpPrimaryUser,
                    pass: process.env.GMAIL_SMTP_PASS_PRIMARY || '',
                },
                {
                    user: smtpSecondaryUser,
                    pass: process.env.GMAIL_SMTP_PASS_SECONDARY || '',
                },
            ],
        },
    },
    storage: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        uploadMaxSize: process.env.UPLOAD_MAX_SIZE || '10MB',
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        secure: process.env.CLOUDINARY_SECURE === 'true',
    },
    app: {
        frontendUrl: process.env.FRONTEND_URL || 'http://enciclopedia.iea.usp.br',
    },
    zenodo: {
        enabled: process.env.ZENODO_ENABLED === 'true',
        accessToken: process.env.ZENODO_ACCESS_TOKEN || '',
        baseUrl: process.env.ZENODO_BASE_URL || 'https://sandbox.zenodo.org',
        license: process.env.ZENODO_LICENSE || 'cc-by-4.0',
        community: process.env.ZENODO_COMMUNITY || '',
    },
    core: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000', 10),
        corsOrigin: process.env.CORS_ORIGIN || ['*'],
    },
};
