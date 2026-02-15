# GitHub Integration & Deployment Guide

## Repository Setup

### 1. GitHub Repository erstellen

```bash
# Navigieren Sie zum Projektordner
cd c:\Users\Nils\Desktop\Programmieren\CMMS_ERP

# Git initialisieren (falls noch nicht geschehen)
git init

# GitHub Remote hinzufügen
git remote add origin https://github.com/IHR-USERNAME/cmms-erp.git

# Aktuellen Branch umbenennen zu main
git branch -M main
```

### 2. .gitignore prüfen

Ihre `.gitignore` sollte Folgendes enthalten:

```
# Dependencies
node_modules/
backend/node_modules/

# Build outputs
dist/
build/
backend/dist/

# Environment variables
.env
.env.local
.env.production
backend/.env
backend/.env.local
backend/.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Android
android/build/
android/.gradle/
android/local.properties
*.apk
*.aab

# Temporary files
*.tmp
.cache/
```

### 3. Commit und Push

```bash
# Alle Änderungen stagen
git add .

# Commit mit aussagekräftiger Nachricht
git commit -m "feat: Add Asset Integrity Management System

- Implemented rig/asset management interface
- Added notes system with deadlines
- Meeting overview generation
- Full CRUD operations for rigs, inspections, issues, improvements
- Prepared backend API service integration"

# Zum GitHub Repository pushen
git push -u origin main
```

## Continuous Integration/Deployment

### GitHub Actions Workflow

Erstellen Sie `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

  backend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

  deploy:
    needs: [frontend-test, backend-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: echo "Deploy to your hosting platform"
        # Hier Ihre Deployment-Logik einfügen
```

## Environment Variables Setup

### Frontend (.env.production)

```env
VITE_API_URL=https://your-api-domain.com
VITE_APP_NAME=CMMS ERP System
```

### Backend (.env.production)

```env
NODE_ENV=production
PORT=5137
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=https://your-frontend-domain.com
```

## GitHub Secrets konfigurieren

Gehen Sie zu Ihrem GitHub Repository → Settings → Secrets and variables → Actions

Fügen Sie hinzu:

- `VITE_API_URL`: Ihre Backend API URL
- `DATABASE_URL`: PostgreSQL Connection String
- `JWT_SECRET`: Secret für JWT Tokens

## Deployment-Optionen

### Option 1: Render.com (Empfohlen)

**Vorteile:**

- Kostenloser PostgreSQL-Dienst
- Automatisches Deployment von GitHub
- SSL-Zertifikate inklusive

**Setup:**

1. **Backend Service:**
   - Neuen Web Service erstellen
   - Repository verbinden
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Environment Variables setzen

2. **Frontend Service:**
   - Neuen Static Site erstellen
   - Repository verbinden
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

3. **PostgreSQL Datenbank:**
   - Neue PostgreSQL Datenbank erstellen
   - Connection String zu Backend Service hinzufügen

### Option 2: Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**

```bash
# Vercel CLI installieren
npm i -g vercel

# Deploy
vercel --prod
```

**Backend (Railway):**

1. Railway Account erstellen
2. "New Project" → "Deploy from GitHub repo"
3. Environment Variables konfigurieren
4. PostgreSQL Plugin hinzufügen

### Option 3: Docker Deployment

Erstellen Sie `docker-compose.yml`:

```yaml
version: "3.8"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://backend:5137

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5137:5137"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/cmms
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=cmms
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Deployment Checklist

- [ ] `.gitignore` aktualisiert
- [ ] Sensible Daten (Secrets, Keys) nicht im Code
- [ ] Environment Variables konfiguriert
- [ ] Backend API Service erstellt
- [ ] Datenbank-Schema deployed
- [ ] GitHub Repository erstellt
- [ ] Code gepusht
- [ ] CI/CD Pipeline konfiguriert
- [ ] Production Build getestet
- [ ] SSL-Zertifikate konfiguriert
- [ ] Domain/DNS konfiguriert
- [ ] Monitoring eingerichtet (optional: Sentry)

## Nächste Schritte

### 1. Backend implementieren

```bash
cd backend
```

Erstellen Sie die Route-Datei wie in `ASSET_INTEGRITY_BACKEND.md` beschrieben.

### 2. Frontend mit Backend verbinden

In `AssetIntegrityManagement.tsx`:

```typescript
import { useEffect } from "react";
import * as api from "@/services/assetIntegrityApi";

export default function AssetIntegrityManagement() {
  // State...

  // Daten vom Backend laden
  useEffect(() => {
    async function loadRigs() {
      try {
        const rigs = await api.getAllRigs();
        setRigs(rigs);
      } catch (error) {
        console.error("Failed to load rigs:", error);
        // Fehlerbehandlung
      }
    }
    loadRigs();
  }, []);

  // Handler-Funktionen anpassen
  const handleAddRig = async () => {
    try {
      const newRigData = await api.createRig(newRig);
      setRigs([...rigs, newRigData]);
      // ...
    } catch (error) {
      console.error("Failed to create rig:", error);
    }
  };

  // ... weitere Handler mit API-Calls
}
```

### 3. Testen

```bash
# Frontend
npm run dev

# Backend
cd backend
npm run dev
```

### 4. Deploy

```bash
# Production Build testen
npm run build
npm run preview

# Push zu GitHub
git add .
git commit -m "Ready for production deployment"
git push origin main
```

## Support & Troubleshooting

### Häufige Probleme

**CORS-Fehler:**

```typescript
// backend/src/index.ts
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
```

**Database Connection:**

```typescript
// backend/src/db.ts
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
```

**Environment Variables nicht geladen:**

```bash
# Installieren Sie dotenv
npm install dotenv

# In backend/src/index.ts
import 'dotenv/config';
```

## Monitoring & Logging

### Sentry Integration (Optional)

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

---

**Viel Erfolg beim Deployment! 🚀**
