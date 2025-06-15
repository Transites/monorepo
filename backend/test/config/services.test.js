/**
 * Unit tests for the services configuration module
 */

// Mock environment variables before importing the module
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Services Configuration', () => {
  // Save original environment
  const originalEnv = { ...process.env };

  // Setup required environment variables for tests
  beforeEach(() => {
    // Clear and reset environment variables
    process.env = { ...originalEnv };

    // Set required environment variables for tests
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.DATABASE_SSL = 'true';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.FROM_EMAIL = 'test@example.com';
    process.env.CLOUDINARY_URL = 'cloudinary://key:secret@name';
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud-name';

    // Clear module cache to ensure fresh import with new env vars
    jest.resetModules();
  });

  // Restore original environment after tests
  afterAll(() => {
    process.env = originalEnv;
  });

  test('should load environment variables correctly', () => {
    // Import the module after setting up environment
    const services = require('../../config/services');

    // Verify database config
    expect(services.database.url).toBe('postgresql://user:pass@localhost:5432/db');
    expect(services.database.ssl).toBe(true);

    // Verify supabase config
    expect(services.supabase.url).toBe('https://example.supabase.co');
    expect(services.supabase.anonKey).toBe('test-anon-key');

    // Verify email config
    expect(services.email.apiKey).toBe('test-resend-key');
    expect(services.email.fromEmail).toBe('test@example.com');
    expect(services.email.fromName).toBe('Enciclopédia Transitos'); // Default value

    // Verify storage config
    expect(services.storage.cloudinaryUrl).toBe('cloudinary://key:secret@name');
    expect(services.storage.cloudName).toBe('test-cloud-name');
    expect(services.storage.uploadMaxSize).toBe('10MB'); // Default value
  });

  test('should use default values when optional variables are not set', () => {
    // Remove optional environment variables
    delete process.env.FROM_NAME;
    delete process.env.REPLY_TO;
    delete process.env.UPLOAD_MAX_SIZE;
    delete process.env.ALLOWED_TYPES;
    delete process.env.NODE_ENV;
    delete process.env.PORT;

    // Import the module after setting up environment
    const services = require('../../config/services');

    // Verify default values
    expect(services.email.fromName).toBe('Enciclopédia Transitos');
    expect(services.email.replyTo).toBe('contato@enciclopedia.iea.usp.br');
    expect(services.storage.uploadMaxSize).toBe('10MB');
    expect(services.storage.allowedTypes).toEqual(['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']);
    expect(services.core.nodeEnv).toBe('development');
    expect(services.core.port).toBe(3000);
  });

  test('should throw error when required variables are missing', () => {
    // Remove a required environment variable
    delete process.env.DATABASE_URL;

    // Importing the module should throw an error
    expect(() => {
      require('../../config/services');
    }).toThrow('Missing required environment variables for Supabase: DATABASE_URL');

    // Reset modules for next test
    jest.resetModules();

    // Set DATABASE_URL but remove RESEND_API_KEY
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    delete process.env.RESEND_API_KEY;

    // Importing the module should throw an error
    expect(() => {
      require('../../config/services');
    }).toThrow('Missing required environment variables for Resend: RESEND_API_KEY');
  });

  test('should load dotenv if environment variables are not set', () => {
    // Clear all relevant environment variables
    delete process.env.DATABASE_URL;

    // Mock dotenv.config to do nothing
    const dotenv = require('dotenv');

    try {
      // This will throw because we deleted DATABASE_URL
      require('../../config/services');
    } catch (error) {
      // Ignore the error, we just want to check if dotenv.config was called
    }

    // Verify dotenv.config was called
    expect(dotenv.config).toHaveBeenCalled();
  });
});
