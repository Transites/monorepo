const path = require('path');

// Mock fs.mkdirSync to avoid actual directory creation (do this before requiring the logger)
jest.mock('fs', () => ({
    mkdirSync: jest.fn()
}));

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

// Require the mocked winston and then the logger so that the module uses the mock
const winston = require('winston');
const logger = require('../../middleware/logging');

// Cast to any for test-time introspection (avoid type complaints)
/** @type {any} */
const winstonMock = winston;
/** @type {any} */
const loggerAny = logger;

describe('Logging Middleware Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should create logs directory if it does not exist', () => {
        // Re-require the logger to trigger the directory creation
        jest.isolateModules(() => {
            require('../../middleware/logging');
            const fs = require('fs');
            expect(fs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('logs'),
                { recursive: true }
            );
        });
    });

    test('should log messages at different levels', () => {
        loggerAny.info('Info message');
        loggerAny.warn('Warning message');
        loggerAny.error('Error message');

        const mockLogger = winstonMock.createLogger();
        /** @type {any} */
        const mockLoggerAny = mockLogger;
        expect(mockLoggerAny.info).toHaveBeenCalled();
        expect(mockLoggerAny.warn).toHaveBeenCalled();
        expect(mockLoggerAny.error).toHaveBeenCalled();
    });

    test('should log messages with metadata', () => {
        const metadata = { user: 'test', action: 'login' };
        loggerAny.info('Info with metadata', metadata);

        const mockLogger = winstonMock.createLogger();
        /** @type {any} */
        const mockLoggerAny = mockLogger;
        expect(mockLoggerAny.info).toHaveBeenCalled();
    });

    test('should provide custom logging methods', () => {
        expect(loggerAny.security).toBeDefined();
        expect(loggerAny.database).toBeDefined();
        expect(loggerAny.performance).toBeDefined();
        expect(loggerAny.audit).toBeDefined();

        loggerAny.security('Security log');
        loggerAny.database('Database log');
        loggerAny.performance('Performance log');
        loggerAny.audit('Audit log');

        const mockLogger = winstonMock.createLogger();
        /** @type {any} */
        const mockLoggerAny2 = mockLogger;
        expect(mockLoggerAny2.warn).toHaveBeenCalled(); // security uses warn
        expect(mockLoggerAny2.info).toHaveBeenCalled(); // others use info
    });

    test('should create performance logger', () => {
    const perfLogger = loggerAny.createPerformanceLogger('test-operation');
        expect(perfLogger).toBeDefined();
        expect(perfLogger.end).toBeDefined();

        perfLogger.end({ result: 'success' });

        const mockLogger = winstonMock.createLogger();
        /** @type {any} */
        const mockLoggerAny3 = mockLogger;
        expect(mockLoggerAny3.info).toHaveBeenCalled();
    });

    test('should measure duration in performance logger', () => {
        // Mock Date.now to control time
        const originalNow = Date.now;
        Date.now = jest.fn()
            .mockReturnValueOnce(1000) // Start time
            .mockReturnValueOnce(1500); // End time (500ms later)

    const perfLogger = loggerAny.createPerformanceLogger('timed-operation');
        perfLogger.end();

        // Restore original Date.now
        Date.now = originalNow;

    const mockLogger = winstonMock.createLogger();
    /** @type {any} */
    const mockLoggerAny4 = mockLogger;
    const infoCall = mockLoggerAny4.info.mock.calls[0];

        // Check that the duration is passed to the logger
        expect(infoCall[1]).toHaveProperty('duration', 500);
    });
});
