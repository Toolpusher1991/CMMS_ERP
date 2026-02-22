// Global test setup
import dotenv from 'dotenv';

// Load .env so JWT_SECRET etc. are available
dotenv.config();

// Provide fallback for tests running without .env
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
}
