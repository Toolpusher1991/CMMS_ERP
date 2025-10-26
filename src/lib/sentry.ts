import * as Sentry from "@sentry/react";

// Initialize Sentry - only if DSN is provided
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Send default PII data (IP addresses, etc.)
    sendDefaultPii: true,
    
    // Error Filtering
    beforeSend(event) {
      // Filter out known development errors
      if (import.meta.env.DEV) {
        console.log("📤 Sentry Event:", event);
      }
      
      // Don't send 401 authentication errors to Sentry (expected behavior)
      if (event.exception?.values?.[0]?.value?.includes("Authentication failed")) {
        return null;
      }
      
      return event;
    },
    
    // Additional context
    initialScope: {
      tags: {
        component: "CMMS-ERP Frontend",
        version: import.meta.env.VITE_APP_VERSION || "1.0.0",
      },
    },
  });
  console.log("✅ Sentry initialized successfully");
} else {
  console.log("⚠️ Sentry DSN not provided - error tracking disabled");
}

// Export Sentry for manual error reporting
export { Sentry };

// Helper function to capture errors with context
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext("Additional Info", context);
      }
      Sentry.captureException(error);
    });
  } else {
    console.error("Error would be sent to Sentry:", error, context);
  }
};

// Simple transaction helper (fallback if not available)
export const startTransaction = (name: string, operation: string) => {
  console.log(`📊 Starting transaction: ${name} (${operation})`);
  return {
    setStatus: (status: string) => console.log(`📊 Transaction status: ${status}`),
    finish: () => console.log(`📊 Transaction finished: ${name}`),
  };
};