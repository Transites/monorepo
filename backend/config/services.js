/**
 * Configuration for external services
 * This module loads and validates environment variables for Supabase, Resend, and Cloudinary
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file if not already loaded
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
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
  validateRequiredVars(['RESEND_API_KEY', 'FROM_EMAIL'], 'Resend');
  validateRequiredVars(['CLOUDINARY_URL', 'CLOUDINARY_CLOUD_NAME'], 'Cloudinary');
};

// Validate configuration on module load
validateConfig();

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
    fromEmail: process.env.FROM_EMAIL,
    fromName: process.env.FROM_NAME || 'Enciclopédia Transitos',
    replyTo: process.env.REPLY_TO || 'contato@enciclopedia.iea.usp.br',
  },
  storage: {
    cloudinaryUrl: process.env.CLOUDINARY_URL,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    uploadMaxSize: process.env.UPLOAD_MAX_SIZE || '10MB',
    allowedTypes: (process.env.ALLOWED_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx').split(','),
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'https://enciclopedia.iea.usp.br',
  },
  core: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
  },
};
