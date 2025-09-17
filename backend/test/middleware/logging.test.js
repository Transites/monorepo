const winston = require('winston');
const path = require('path');
const fs = require('fs');
const logger = require('../../middleware/logging');

// Mock winston to avoid actual file writing during tests
jest.mock('winston', () => {
    const mockFormat = {
        combine: jest.fn().mockReturnThis(),
        timestamp: jest.fn().mockReturnThis(),
        errors: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        printf: jest.fn().mockReturnThis(),
        colorize: jest.fn().mockReturnThis(),
        simple: jest.fn().mockReturnThis()
    };

    const mockTransport = jest.fn().mockImplementation(() => ({
        on: jest.fn()
    }));

    return {
        format: mockFormat,
        createLogger: jest.fn().mockReturnValue({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        }),
        transports: {
            File: mockTransport,
            Console: mockTransport
        }
    };
});

// Mock fs.mkdirSync to avoid actual directory creation
jest.mock('fs', () => ({
    mkdirSync: jest.fn()
}));

describe('Logging Middleware Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should create logs directory if it does not exist', () => {
        // Re-require the logger to trigger the directory creation
        jest.isolateModules(() => {
            require('../../middleware/logging');
            expect(fs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('logs'),
                { recursive: true }
            );
        });
    });

    test('should create a logger with the correct configuration', () => {
        expect(winston.createLogger).toHaveBeenCalled();
        const createLoggerArgs = winston.createLogger.mock.calls[0][0];

        expect(createLoggerArgs).toHaveProperty('level');
        expect(createLoggerArgs).toHaveProperty('format');
        expect(createLoggerArgs).toHaveProperty('defaultMeta');
        expect(createLoggerArgs).toHaveProperty('transports');
        expect(createLoggerArgs).toHaveProperty('exceptionHandlers');
        expect(createLoggerArgs).toHaveProperty('rejectionHandlers');
    });

    test('should log messages at different levels', () => {
        logger.info('Info message');
        logger.warn('Warning message');
        logger.error('Error message');

        const mockLogger = winston.createLogger();
        expect(mockLogger.info).toHaveBeenCalled();
        expect(mockLogger.warn).toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should log messages with metadata', () => {
        const metadata = { user: 'test', action: 'login' };
        logger.info('Info with metadata', metadata);

        const mockLogger = winston.createLogger();
        expect(mockLogger.info).toHaveBeenCalled();
    });

    test('should provide custom logging methods', () => {
        expect(logger.security).toBeDefined();
        expect(logger.database).toBeDefined();
        expect(logger.performance).toBeDefined();
        expect(logger.audit).toBeDefined();

        logger.security('Security log');
        logger.database('Database log');
        logger.performance('Performance log');
        logger.audit('Audit log');

        const mockLogger = winston.createLogger();
        expect(mockLogger.warn).toHaveBeenCalled(); // security uses warn
        expect(mockLogger.info).toHaveBeenCalled(); // others use info
    });

    test('should create performance logger', () => {
        const perfLogger = logger.createPerformanceLogger('test-operation');
        expect(perfLogger).toBeDefined();
        expect(perfLogger.end).toBeDefined();

        perfLogger.end({ result: 'success' });

        const mockLogger = winston.createLogger();
        expect(mockLogger.info).toHaveBeenCalled();
    });

    test('should measure duration in performance logger', () => {
        // Mock Date.now to control time
        const originalNow = Date.now;
        Date.now = jest.fn()
            .mockReturnValueOnce(1000) // Start time
            .mockReturnValueOnce(1500); // End time (500ms later)

        const perfLogger = logger.createPerformanceLogger('timed-operation');
        perfLogger.end();

        // Restore original Date.now
        Date.now = originalNow;

        const mockLogger = winston.createLogger();
        const infoCall = mockLogger.info.mock.calls[0];

        // Check that the duration is passed to the logger
        expect(infoCall[1]).toHaveProperty('duration', 500);
    });
});
