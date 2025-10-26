import * as Sentry from '@sentry/node';

export function initSentry() {
  const environment = process.env.NODE_ENV || 'development';
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('⚠️  Sentry DSN not found - Sentry disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Error filtering - don't send validation errors to Sentry
    beforeSend(event) {
      // Skip validation errors (400 status codes)
      if (event.tags?.status === '400') {
        return null;
      }
      return event;
    },
  });

  console.log(`✅ Sentry initialized for ${environment}`);
}

export function captureError(error: Error, extra?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra,
    tags: {
      service: 'backend',
    },
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

export { Sentry };