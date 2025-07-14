import { Logger } from 'winston';

interface CustomLogger extends Logger {
    security(message: string, meta?: object): void;
    database(message: string, meta?: object): void;
    performance(message: string, meta?: object): void;
    audit(message: string, meta?: object): void;
    createPerformanceLogger(operationName: string): {
        end(meta?: object): void;
    };
    error(message: string, meta?: object): void;
    warn(message: string, meta?: object): void;
    info(message: string, meta?: object): void;
    debug(message: string, meta?: object): void;
}

declare const logger: CustomLogger;
export = logger;
