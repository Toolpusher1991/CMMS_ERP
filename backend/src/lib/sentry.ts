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
    // Error filtering - be more permissive in production to catch all issues
    beforeSend(event) {
      // In production, log all errors to Sentry for debugging
      if (environment === 'production') {
        console.log('📤 Sending error to Sentry:', event.exception?.values?.[0]?.value);
        return event; // Send all errors in production
      }
      
      // In development, skip only validation errors (400 status codes)
      if (event.tags?.status === '400') {
        return null;
      }
      return event;
    },
    // Add more context
    initialScope: {
      tags: {
        service: 'backend',
        component: 'api'
      }
    }
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