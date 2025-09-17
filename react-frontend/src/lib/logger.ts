/**
 * Centralized logging utility
 * Handles production vs development logging automatically
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

class Logger {
  private isDev: boolean;
  private originalConsole: Record<LogLevel, typeof console.log>;

  constructor() {
    this.isDev = import.meta.env.DEV;

    // Store original console methods
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };

    // Override console methods in production
    if (!this.isDev) {
      this.overrideConsole();
    }
  }

  private overrideConsole() {
    // In production, suppress console.error and console.log
    // but still allow console.warn for important warnings
    console.error = (...args: unknown[]) => {
      // Optionally send to error reporting service here
      // e.g., Sentry, LogRocket, etc.
      this.sendToErrorService('error', args);
    };

    console.log = (...args: unknown[]) => {
      this.sendToErrorService('log', args);
    };

    console.debug = (...args: unknown[]) => {
      this.sendToErrorService('debug', args);
    };

    // Keep info and warn for important production messages
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
  }

  private sendToErrorService(level: LogLevel, args: unknown[]) {
    // This is where you'd integrate with error reporting services
    // For now, we just suppress the logs

    // Example integrations:
    // - Sentry: Sentry.captureException()
    // - LogRocket: LogRocket.captureException()
    // - Custom endpoint: fetch('/api/logs', { method: 'POST', ... })
  }

  // Direct logging methods that respect environment
  log(...args: unknown[]) {
    if (this.isDev) {
      this.originalConsole.log(...args);
    }
  }

  error(...args: unknown[]) {
    if (this.isDev) {
      this.originalConsole.error(...args);
    } else {
      this.sendToErrorService('error', args);
    }
  }

  warn(...args: unknown[]) {
    this.originalConsole.warn(...args);
  }

  info(...args: unknown[]) {
    this.originalConsole.info(...args);
  }

  debug(...args: unknown[]) {
    if (this.isDev) {
      this.originalConsole.debug(...args);
    }
  }
}

// Create and initialize the logger
const logger = new Logger();

export default logger;

// Export individual methods for convenience
export const { log, error, warn, info, debug } = logger;