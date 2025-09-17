/**
 * Health check module for external services
 * This module provides functions to test connectivity with Supabase, Resend, and Cloudinary
 */

const { Client } = require('pg');
const { Resend } = require('resend');
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');
const services = require('./services');

/**
 * Tests connection to PostgreSQL database
 * @param connectionString {string} - PostgreSQL connection string
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<{success: boolean, message: string}>} Result of the connection test
 */
async function testPostgresConnection(connectionString, timeout = 5000) {
  const client = new Client({
    connectionString: connectionString,
    ssl: services.database.ssl ? { rejectUnauthorized: false } : false,
  });

  try {
    // Set connection timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), timeout);
    });

    // Connect and query
    const connectionPromise = (async () => {
      await client.connect();
      const result = await client.query('SELECT NOW()');
      return result.rows[0];
    })();

    // Race between connection and timeout
    const result = await Promise.race([connectionPromise, timeoutPromise]);
    await client.end();

    return {
      success: true,
      message: `Successfully connected to PostgreSQL. Server time: ${result.now}`,
    };
  } catch (error) {
    try {
      await client.end();
    } catch (e) {
      // Ignore error on client end
    }

    return {
      success: false,
      message: `Failed to connect to PostgreSQL: ${error.message}`,
    };
  }
}

/**
 * Tests connection to Supabase
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<{success: boolean, message: string}>} Result of the connection test
 */
async function testSupabaseConnection(timeout = 5000) {
  try {
    const supabase = createClient(
      services.supabase.url,
      services.supabase.anonKey
    );

    // Set connection timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), timeout);
    });

    // Test connection with a simple query
    const connectionPromise = supabase.from('_dummy_query').select('*').limit(1);

    // Race between connection and timeout
    await Promise.race([connectionPromise, timeoutPromise]);

    return {
      success: true,
      message: 'Successfully connected to Supabase',
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Supabase: ${error.message}`,
    };
  }
}

/**
 * Tests connection to Resend email service
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @param apiKey {string} - Resend API key
 * @returns {Promise<{success: boolean, message: string}>} Result of the connection test
 */
async function testResendConnection(apiKey, timeout = 5000) {
  try {
    const resend = new Resend(apiKey);

    // Set connection timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), timeout);
    });

    // Test connection with a dummy email (not actually sent)
    const connectionPromise = resend.emails.get('email_id_that_does_not_exist');

    try {
      // Race between connection and timeout
      await Promise.race([connectionPromise, timeoutPromise]);
    } catch (error) {
      // We expect an error here since the email ID doesn't exist
      // But if the error is about authentication or connection, that's a real error
      if (error.message.includes('timeout') ||
          error.message.includes('authentication') ||
          error.message.includes('invalid') ||
          error.message.includes('network')) {
        throw error;
      }
    }

    return {
      success: true,
      message: 'Successfully connected to Resend API',
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Resend API: ${error.message}`,
    };
  }
}

/**
 * Tests connection to Cloudinary storage service
 * @param url {string} - Cloudinary URL from environment variables
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<{success: boolean, message: string}>} Result of the connection test
 */
async function testCloudinaryConnection(url, timeout = 5000) {
  try {
    // Configure cloudinary with the URL from environment
    cloudinary.config({
      url,
    });

    // Set connection timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), timeout);
    });

    // Test connection by getting account info
    const connectionPromise = cloudinary.api.ping();

    // Race between connection and timeout
    await Promise.race([connectionPromise, timeoutPromise]);

    return {
      success: true,
      message: 'Successfully connected to Cloudinary',
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Cloudinary: ${error.message}`,
    };
  }
}

/**
 * Tests all external service connections
 * @param {number} [timeout=5000] - Timeout in milliseconds for each test
 * @returns {Promise<{postgres: object, supabase: object, resend: object, cloudinary: object}>} Results of all connection tests
 */
async function testAllConnections(timeout = 5000) {
  const [postgres, supabase, resend, cloudinary] = await Promise.all([
    testPostgresConnection(timeout),
    testSupabaseConnection(timeout),
    testResendConnection(services.email.apiKey, timeout),
    testCloudinaryConnection(services.email.apiKey, timeout),
  ]);

  return {
    postgres,
    supabase,
    resend,
    cloudinary,
  };
}

// If this file is executed directly, run the tests and output results
if (require.main === module) {
  (async () => {
    try {
      console.log('Testing connections to external services...');
      const results = await testAllConnections();

      console.log('\n=== Connection Test Results ===');
      for (const [service, result] of Object.entries(results)) {
        console.log(`\n${service.toUpperCase()}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`  ${result.message}`);
      }

      // Exit with appropriate code
      const allSuccessful = Object.values(results).every(result => result.success);
      process.exit(allSuccessful ? 0 : 1);
    } catch (error) {
      console.error('Error running tests:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  testPostgresConnection,
  testSupabaseConnection,
  testResendConnection,
  testCloudinaryConnection,
  testAllConnections,
};
