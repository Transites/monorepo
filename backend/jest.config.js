/**
 * Jest configuration for testing the backend
 */

module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'node',

  // Transform files with ts-jest
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.test.ts',
  ],

  // An array of regexp pattern strings that are matched against all test paths
  // matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.tmp/',
    '/dist/',
  ],

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.tmp/',
    '/dist/',
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'text',
    'lcov',
    'clover',
  ],

  // The minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
