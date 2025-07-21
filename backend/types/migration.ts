export interface LoggerWithAudit {
    error: jest.Mock;
    info: jest.Mock;
    warn: jest.Mock;
    debug: jest.Mock;
    audit: jest.Mock;
    security: jest.Mock;
    database: jest.Mock;
    performance: jest.Mock;
    createPerformanceLogger: jest.Mock;
}
