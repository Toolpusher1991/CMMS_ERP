/**
 * Centralized Logging System
 * 
 * Replaces console.log/error with structured logging
 * - Development: Logs to console with colors
 * - Production: Logs to Sentry (errors only)
 * 
 * Usage:
 * import { logger } from '@/lib/logger';
 * logger.debug('User clicked button', { userId: '123' });
 * logger.error('API call failed', error);
 */

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';
  private isProduction = import.meta.env.MODE === 'production';

  /**
   * Debug logs - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Info logs - development and production
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`ℹ️ [INFO] ${message}`, context || '');
    }
    // In production, könnte man dies zu Analytics senden
  }

  /**
   * Warning logs
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`⚠️ [WARN] ${message}`, context || '');
    
    if (this.isProduction && window.Sentry) {
      window.Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  }

  /**
   * Error logs - always logged + sent to Sentry
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(`❌ [ERROR] ${message}`, error, context || '');

    if (this.isProduction && window.Sentry) {
      if (error instanceof Error) {
        window.Sentry.captureException(error, {
          extra: { message, ...context },
        });
      } else {
        window.Sentry.captureMessage(message, {
          level: 'error',
          extra: { error, ...context },
        });
      }
    }
  }

  /**
   * Success logs - only in development
   */
  success(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`✅ [SUCCESS] ${message}`, context || '');
    }
  }

  /**
   * API logs - for tracking API calls
   */
  api(method: string, endpoint: string, status: number, duration?: number): void {
    if (this.isDevelopment) {
      const emoji = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(
        `${emoji} [API] ${method} ${endpoint} - ${status}${duration ? ` (${duration}ms)` : ''}`
      );
    }
  }

  /**
   * Performance logs
   */
  perf(label: string, duration: number): void {
    if (this.isDevelopment) {
      const color = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴';
      console.log(`${color} [PERF] ${label} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Measure performance of async operations
   */
  async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.perf(label, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed after ${duration.toFixed(2)}ms`, error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Add Sentry type to window
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: { extra?: unknown }) => void;
      captureMessage: (message: string, options?: { level?: string; extra?: unknown }) => void;
    };
  }
}
