# 🔒 Security Documentation

## ✅ Implemented Security Features

### 1. Authentication & Authorization

#### JWT Tokens

- **Access Token**: 15-minute expiration (short-lived)
- **Refresh Token**: 7-day expiration (stored in database)
- Automatic token refresh on 401 responses
- Secure token storage in localStorage

#### Password Security

- **Bcrypt hashing** with 12 rounds (stronger than default 10)
- **Strong password requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

#### Role-Based Access Control (RBAC)

- Three roles: `ADMIN`, `MANAGER`, `USER`
- Protected endpoints with role verification
- User admin features restricted to ADMIN role

### 2. Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Auth Endpoints** (login/register): 5 attempts per 15 minutes per IP
- Protection against brute-force attacks

### 3. HTTP Security Headers (Helmet.js)

Automatically sets secure HTTP headers:

- X-DNS-Prefetch-Control
- X-Frame-Options
- Strict-Transport-Security
- X-Download-Options
- X-Content-Type-Options
- X-XSS-Protection

### 4. CORS Protection

- Whitelist-based origin checking
- Configurable via environment variable
- Supports multiple domains (comma-separated)

### 5. Request Security

- **Body size limits**: 10MB max
- **Input validation**: Zod schemas
- **SQL Injection**: Protected by Prisma ORM

### 6. Logging & Monitoring

Winston logger with:

- Security event logging (login attempts, failures, etc.)
- Error tracking
- Separate log files for errors and combined logs
- IP address logging for security events

### 7. Database Security

- Password never exposed in API responses
- Refresh tokens stored with expiration
- Cascade deletion of refresh tokens on user deletion
- Active user status checking

## 🚨 Production Checklist

### Before Deployment

- [ ] **Change JWT_SECRET** to a strong random value (64+ bytes)

  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

- [ ] **Switch to PostgreSQL** (SQLite is NOT production-ready)

  - Update `DATABASE_URL` in `.env`
  - Run migrations: `npx prisma migrate deploy`

- [ ] **Set up HTTPS**

  - Use nginx/caddy as reverse proxy
  - Obtain SSL certificates (Let's Encrypt)
  - Force HTTPS redirects

- [ ] **Update CORS_ORIGIN**

  - Add your production domain(s)
  - Remove localhost origins

- [ ] **Set NODE_ENV=production**

- [ ] **Enable logging**

  - Configure LOG_LEVEL=warn or LOG_LEVEL=error
  - Set up log rotation
  - Consider centralized logging (ELK, Datadog, etc.)

- [ ] **Database backups**

  - Automated daily backups
  - Off-site backup storage
  - Test restore procedures

- [ ] **Environment variables**

  - Never commit `.env` to git
  - Use secrets management (AWS Secrets Manager, etc.)
  - Different credentials per environment

- [ ] **Monitoring**
  - Set up health check endpoints
  - Configure uptime monitoring
  - Error tracking (Sentry, Rollbar, etc.)

### Additional Security Measures (Recommended)

#### High Priority

1. **Two-Factor Authentication (2FA)**

   - Add TOTP support for admin accounts
   - Consider SMS or email verification

2. **Account Lockout**

   - Lock accounts after X failed login attempts
   - Implement unlock mechanisms (email, admin)

3. **Password Reset Flow**

   - Secure token-based password reset
   - Email verification
   - Rate limiting on reset requests

4. **Session Management**
   - Implement session revocation
   - Show active sessions to users
   - "Logout all devices" feature

#### Medium Priority

5. **API Versioning**

   - `/api/v1/...` structure
   - Deprecation strategy

6. **CSRF Protection**

   - Add CSRF tokens for state-changing operations
   - Use SameSite cookies

7. **Content Security Policy (CSP)**

   - Restrict inline scripts
   - Whitelist trusted sources

8. **Database Encryption**
   - Encrypt sensitive fields at rest
   - Use PostgreSQL encryption features

#### Lower Priority

9. **Audit Logging**

   - Log all CRUD operations
   - User action history
   - Compliance requirements (GDPR, etc.)

10. **IP Whitelisting**
    - For admin panel access
    - VPN/bastion host setup

## 🔧 Security Configuration

### Environment Variables

```env
# Production settings
NODE_ENV=production
JWT_SECRET=<64-byte-hex-string>
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
DATABASE_URL=postgresql://...
```

### Rate Limiting Configuration

Edit `src/middleware/rate-limit.middleware.ts`:

```typescript
// Adjust as needed for your traffic
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increase for high-traffic apps
});
```

### Password Policy

Edit `src/controllers/auth.controller.ts`:

```typescript
const passwordSchema = z
  .string()
  .min(8) // Increase if needed
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);
```

## 🐛 Security Testing

### Manual Testing

1. **Test rate limiting**:

   ```bash
   for i in {1..10}; do curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"wrong"}'; done
   ```

2. **Test token expiration**:

   - Login
   - Wait 16 minutes
   - Make authenticated request
   - Verify automatic token refresh

3. **Test weak passwords**:
   - Try registering with "password123"
   - Should fail validation

### Automated Testing

Consider adding:

- Unit tests for auth logic
- Integration tests for API endpoints
- Security scanning (npm audit, Snyk)
- Dependency vulnerability checks

## 📞 Security Incident Response

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. Email security concerns to: [your-email@example.com]
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 🔄 Regular Security Maintenance

- [ ] Update dependencies weekly: `npm audit fix`
- [ ] Review security logs monthly
- [ ] Rotate JWT secrets quarterly
- [ ] Security audit annually
- [ ] Penetration testing (as needed)
