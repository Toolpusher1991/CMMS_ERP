# Quick Sentry Test

# 1. Uncomment these lines in .env:

# VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# VITE_SENTRY_ENVIRONMENT=development

# 2. Start dev server: npm run dev

# 3. Open browser console

# 4. Try to save a tender

# 5. Check Sentry dashboard for errors

# Expected Console Logs:

# ✅ "Sentry initialized" (if DSN provided)

# ✅ "🔧 API Base URL: http://localhost:3000/api"

# ✅ "📊 Starting transaction: tender.getAllTenders"

# ❌ "Error would be sent to Sentry: [error details]"

# Expected Sentry Dashboard:

# 🔴 New Issue: "HTTP error! status: 404"

# 📊 Performance: tender.getAllTenders transaction
