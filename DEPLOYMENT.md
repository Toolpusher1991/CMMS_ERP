# 🚀 Deployment Guide

## Quick Start

This guide covers deploying your CMMS/ERP application to production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Domain name with SSL certificate
- Server with at least 2GB RAM

## 1. Database Setup (PostgreSQL)

### Option A: Docker (Recommended for quick setup)

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Connection string:
# postgresql://cmms_user:changeme@localhost:5432/cmms_erp
```

### Option B: Managed Database

Use a managed service:

- **AWS RDS** (PostgreSQL)
- **Google Cloud SQL**
- **DigitalOcean Managed Databases**
- **Supabase** (PostgreSQL with extras)
- **Heroku Postgres**

### Database Migration

```bash
cd backend

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@host:5432/database"

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run seed
```

## 2. Backend Deployment

### Environment Setup

1. Copy `.env.example` to `.env`:

```bash
cd backend
cp .env.example .env
```

2. Generate strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

3. Update `.env`:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=<your-generated-secret>
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
```

### Build & Start

```bash
cd backend
npm install
npm run build
npm start
```

### Process Manager (PM2)

For production, use PM2 to keep the server running:

```bash
# Install PM2 globally
npm install -g pm2

# Start app
cd backend
pm2 start dist/index.js --name cmms-api

# Save PM2 configuration
pm2 save

# Auto-start on server reboot
pm2 startup
```

### Deployment Options

#### A. VPS (DigitalOcean, Linode, AWS EC2)

```bash
# SSH into server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/yourusername/cmms-erp.git
cd cmms-erp/backend

# Install dependencies & build
npm install
npm run build

# Start with PM2
pm2 start dist/index.js --name cmms-api
```

#### B. Platform as a Service

**Heroku**:

```bash
# Install Heroku CLI
heroku create cmms-erp-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

**Railway.app** (Easiest):

1. Connect GitHub repository
2. Railway auto-detects Node.js
3. Add PostgreSQL service
4. Set environment variables in dashboard
5. Deploy automatically on push

**Render.com**:

1. Create new Web Service
2. Connect GitHub repository
3. Build command: `cd backend && npm install && npm run build`
4. Start command: `cd backend && npm start`
5. Add PostgreSQL database
6. Set environment variables

## 3. Frontend Deployment

### Build Frontend

```bash
cd frontend  # or root directory if not in frontend folder
npm install
npm run build
```

This creates a `dist` folder with static files.

### Deployment Options

#### A. Static Hosting (Vercel - Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Set environment variables
vercel env add VITE_API_URL production
# Enter: https://api.yourdomain.com
```

#### B. Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

#### C. Static Server (Nginx)

```nginx
# /etc/nginx/sites-available/cmms-erp
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/cmms-erp/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/cmms-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4. SSL/HTTPS Setup

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal:
sudo certbot renew --dry-run
```

### Update CORS

After SSL is set up, update backend `.env`:

```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

## 5. Monitoring & Maintenance

### Health Checks

Set up uptime monitoring:

- [UptimeRobot](https://uptimerobot.com/) (Free)
- [Pingdom](https://www.pingdom.com/)
- [Better Uptime](https://betteruptime.com/)

Monitor endpoint: `https://api.yourdomain.com/health`

### Error Tracking

Install Sentry (optional):

```bash
cd backend
npm install @sentry/node

# Add to src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Log Rotation

```bash
# Install logrotate config
sudo nano /etc/logrotate.d/cmms-erp
```

```
/path/to/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

### Database Backups

```bash
# Create backup script
nano backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
# Upload to S3 or backup storage
```

Schedule with cron:

```bash
crontab -e
# Add: 0 2 * * * /path/to/backup-db.sh
```

## 6. CI/CD Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Deploy to server
        run: |
          # SSH and deploy
          # Or use platform-specific deployment

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Build
        run: |
          npm install
          npm run build

      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 7. Post-Deployment Checklist

- [ ] Verify database connection
- [ ] Test user registration
- [ ] Test user login
- [ ] Test token refresh mechanism
- [ ] Test API rate limiting
- [ ] Check logs for errors
- [ ] Verify HTTPS is working
- [ ] Test CORS from frontend
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Document credentials securely
- [ ] Test error reporting
- [ ] Load testing (optional)

## 8. Scaling Considerations

### Horizontal Scaling

- Use load balancer (nginx, AWS ALB)
- Deploy multiple backend instances
- Use Redis for session storage
- Consider CDN for frontend (Cloudflare)

### Database Scaling

- Connection pooling (Prisma handles this)
- Read replicas for read-heavy workloads
- Database indexes for performance
- Consider caching (Redis)

### Optimization

- Enable compression (gzip)
- Optimize images
- Code splitting (Vite does this)
- CDN for static assets

## 🆘 Troubleshooting

### Backend won't start

- Check logs: `pm2 logs cmms-api`
- Verify DATABASE_URL
- Check port is not in use: `lsof -i :3000`

### CORS errors

- Verify CORS_ORIGIN in backend .env
- Check browser console for exact error
- Ensure protocol matches (http vs https)

### Database connection errors

- Test connection: `psql $DATABASE_URL`
- Check firewall rules
- Verify credentials

### 401 Unauthorized errors

- Check JWT_SECRET matches between environments
- Verify token isn't expired
- Check Authorization header format

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

## 💡 Support

For deployment issues, check:

1. Application logs
2. Server logs
3. Database logs
4. Network/firewall settings

Still stuck? Open an issue on GitHub!
