/* eslint-disable no-console */

// Define log levels
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Simple logger implementation
class SimpleLogger {
  private level: LogLevel;

  constructor() {
    // Set log level based on environment
    this.level =
      process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private writeToConsole(level: string, message: string, meta?: any): void {
    // Format message
    const timestamp = this.getTimestamp();

    // Add colors for better readability in console
    let coloredLevel = level;
    if (process && process.stdout?.hasColors?.()) {
      switch (level) {
        case 'ERROR':
          coloredLevel = `\x1b[31m${level}\x1b[0m`;
          break; // Red
        case 'WARN':
          coloredLevel = `\x1b[33m${level}\x1b[0m`;
          break; // Yellow
        case 'INFO':
          coloredLevel = `\x1b[36m${level}\x1b[0m`;
          break; // Cyan
        case 'DEBUG':
          coloredLevel = `\x1b[34m${level}\x1b[0m`;
          break; // Blue
      }
    }

    const consoleMethod =
      level === 'ERROR' || level === 'WARN' ? console.error : console.log;

    consoleMethod(`${timestamp} [${coloredLevel}]: ${message}`);
    if (meta && Object.keys(meta).length > 0) {
      consoleMethod(meta);
    }
  }

  debug(message: string | any, meta?: any): void {
    if (this.level < LogLevel.DEBUG) return;

    if (typeof message !== 'string') {
      meta = message;
      message = meta.message || 'Debug information';
    }

    this.writeToConsole('DEBUG', message, meta);
  }

  info(message: string | any, meta?: any): void {
    if (this.level < LogLevel.INFO) return;

    if (typeof message !== 'string') {
      meta = message;
      message = meta.message || 'Info';
    }

    this.writeToConsole('INFO', message, meta);
  }

  warn(message: string | any, meta?: any): void {
    if (this.level < LogLevel.WARN) return;

    if (typeof message !== 'string') {
      meta = message;
      message = meta.message || 'Warning';
    }

    this.writeToConsole('WARN', message, meta);
  }

  error(message: string | any, meta?: any): void {
    if (this.level < LogLevel.ERROR) return;

    if (typeof message !== 'string') {
      meta = message;
      message = meta.message || 'Error';
    }

    this.writeToConsole('ERROR', message, meta);
  }
}

// Create logger instances
export const logger = new SimpleLogger();
export const requestLogger = logger;
