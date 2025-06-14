/**
 * Unit tests for the healthcheck module
 */

// Mock dependencies
jest.mock('pg', () => {
  const mockClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mockClient) };
});

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        get: jest.fn(),
      },
    })),
  };
});

jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      api: {
        ping: jest.fn(),
      },
    },
  };
});

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
  };
});

// Mock services configuration
jest.mock('./services', () => ({
  database: {
    url: 'postgresql://user:pass@localhost:5432/db',
    ssl: true,
  },
  supabase: {
    url: 'https://example.supabase.co',
    anonKey: 'test-anon-key',
  },
  email: {
    apiKey: 'test-resend-key',
    fromEmail: 'test@example.com',
    fromName: 'Test Name',
    replyTo: 'reply@example.com',
  },
  storage: {
    cloudinaryUrl: 'cloudinary://key:secret@name',
    cloudName: 'test-cloud-name',
    uploadMaxSize: '10MB',
    allowedTypes: ['jpg', 'jpeg', 'png'],
  },
}));

describe('Healthcheck Module', () => {
  // Import dependencies after mocking
  const { Client } = require('pg');
  const cloudinary = require('cloudinary').v2;
  const { createClient } = require('@supabase/supabase-js');
  const healthcheck = require('./healthcheck');
  const services = require('./services');

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('testPostgresConnection', () => {
    test('should return success when connection is successful', async () => {
      // Setup mock implementation
      const mockClient = new Client();
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date().toISOString() }] });

      // Call the function
      const result = await healthcheck.testPostgresConnection(services.database.url);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully connected to PostgreSQL');

      // Verify the mocks were called correctly
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
      expect(mockClient.end).toHaveBeenCalled();
    });

    test('should return failure when connection fails', async () => {
      // Call the function
      const result = await healthcheck.testPostgresConnection("invalid-connection-string");

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to connect to PostgreSQL');
    });

    test('should handle timeout correctly', async () => {
      // Setup mock implementation to simulate timeout
      const mockClient = new Client();
      mockClient.connect.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

      // Call the function with a short timeout
      const result = await healthcheck.testPostgresConnection(services.database.url, 10);

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to connect to PostgreSQL');
      expect(result.message).toContain('Connection timeout');
    });
  });

  describe('testSupabaseConnection', () => {
    test('should return success when connection is successful', async () => {
      // Call the function
      const result = await healthcheck.testSupabaseConnection();

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully connected to Supabase');

      // Verify the mocks were called correctly
      expect(createClient).toHaveBeenCalledWith(
        'https://example.supabase.co',
        'test-anon-key'
      );
    });
  });

  describe('testResendConnection', () => {
    test('should return success when connection is successful', async () => {
      // Call the function
      const result = await healthcheck.testResendConnection(services.email.apiKey);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully connected to Resend API');
    });

    test('should return failure when connection fails with authentication error', async () => {
      const result = await healthcheck.testResendConnection("any-key");

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to connect to Resend API');
      expect(result.message).toContain('authentication failed');
    });
  });

  describe('testCloudinaryConnection', () => {
    test('should return success when connection is successful', async () => {
      // Call the function
      const result = await healthcheck.testCloudinaryConnection(services.storage.cloudinaryUrl);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully connected to Cloudinary');

      expect(cloudinary.config).toHaveBeenCalledWith({
        url: 'cloudinary://key:secret@name',
      });
      expect(cloudinary.api.ping).toHaveBeenCalled();
    });

    test('should return failure when connection fails', async () => {
      // Call the function
      const result = await healthcheck.testCloudinaryConnection("invalid-cloudinary-url");

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to connect to Cloudinary');
      expect(result.message).toContain('Cloudinary error');
    });
  });

  describe('testAllConnections', () => {
    test('should test all connections and return combined results', async () => {
      // Setup mock implementations
      const mockClient = new Client();
      mockClient.query.mockResolvedValueOnce({ rows: [{ now: new Date().toISOString() }] });

      cloudinary.api.ping.mockResolvedValueOnce({ status: 'ok' });

      // Call the function
      const results = await healthcheck.testAllConnections();

      // Verify the results structure
      expect(results).toHaveProperty('postgres');
      expect(results).toHaveProperty('supabase');
      expect(results).toHaveProperty('resend');
      expect(results).toHaveProperty('cloudinary');

      // Verify all results are successful
      expect(results.postgres.success).toBe(true);
      expect(results.supabase.success).toBe(true);
      expect(results.resend.success).toBe(true);
      expect(results.cloudinary.success).toBe(true);
    });
  });
});
