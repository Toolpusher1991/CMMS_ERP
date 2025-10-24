# CMMS ERP - Production Deployment Guide

## ✅ Completed Setup Steps

### 1. PostgreSQL Database ✅
- Database created on Render: `cmms-erp-db`
- Region: Frankfurt (EU Central)
- Connection URL configured
- Migration completed
- Seed data imported (Admin, Users, Rig Crews, Projects)

### 2. JWT Secrets Generated ✅
- Production-grade 512-bit secrets generated
- Stored in backend/.env

### 3. Backend Ready for Deployment ✅
- Package.json configured with postinstall script
- Prisma migration deployment command added
- render.yaml created for automatic deployment

---

## 🚀 Backend Deployment auf Render

### Option A: Automatic Deployment (Empfohlen)

1. **Push Code zu GitHub:**
   ```bash
   git add -A
   git commit -m "Add production configuration for Render"
   git push origin master
   ```

2. **Render Dashboard:**
   - Gehe zu https://dashboard.render.com
   - Klick auf "New +" → "Web Service"
   - Wähle dein GitHub Repository: `Toolpusher1991/CMMS_ERP`
   - Render erkennt automatisch die `render.yaml`
   - Klick auf "Apply"

3. **Environment Variables setzen** (die mit `sync: false`):
   
   Gehe zu deinem Backend Service → Environment:
   
   ```
   JWT_SECRET=7ede59671b891092b7c27cc25af8ab9a8a9c28305a3e5dbb8133ba96fecc3aa9489bd7dba508096cfdab7e83a1a7e9584162316d92610143dbb120d8b9bfb7d1
   
   JWT_REFRESH_SECRET=4ece0a00e10551fa2a603f8dd9bf11b2e58ad2efdef8284ea58c8ca56544776306e31a998800f11731d40d032fde3b017ae07f5f2f0b696f81d363f0f831d8ce
   
   OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_FROM_PLATFORM_OPENAI_COM
   
   CORS_ORIGIN=https://YOUR-FRONTEND-URL.onrender.com
   ```

### Option B: Manual Setup

Falls render.yaml nicht automatisch erkannt wird:

1. **Create Web Service:**
   - Name: `cmms-erp-backend`
   - Region: Frankfurt
   - Branch: `master`
   - Root Directory: `backend`
   - Runtime: Node
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npm start`

2. **Connect Database:**
   - Unter "Environment" → "DATABASE_URL"
   - Wähle deine PostgreSQL Database aus der Liste

3. **Set Environment Variables** (siehe oben)

---

## 🌐 Frontend Deployment auf Render

### Vorbereitung:

1. **API URL konfigurieren:**
   
   Die Backend-URL von Render wird sein: `https://cmms-erp-backend.onrender.com`
   
   Update `src/services/api.ts`:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5137';
   ```

2. **Build Script checken** (sollte schon in package.json sein):
   ```json
   "scripts": {
     "build": "tsc && vite build"
   }
   ```

### Deployment:

1. **Create Static Site:**
   - Render Dashboard → "New +" → "Static Site"
   - Repository: `Toolpusher1991/CMMS_ERP`
   - Branch: `master`
   - Root Directory: `` (leer lassen)
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Environment Variable:**
   ```
   VITE_API_URL=https://cmms-erp-backend.onrender.com
   ```

---

## 🔒 Security Checklist

- ✅ PostgreSQL statt SQLite
- ✅ Sichere JWT Secrets (512-bit)
- ✅ HTTPS automatisch durch Render
- ✅ Helmet.js aktiviert
- ✅ CORS konfiguriert
- ✅ Rate Limiting aktiv
- ✅ Environment Variables nicht im Code
- ⏳ CORS_ORIGIN auf Frontend-URL setzen (nach Frontend-Deployment)

---

## 📝 Login Credentials (Production)

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Test User:**
- Email: `user@example.com`
- Password: `user123`

**Rig Crew (alle Rigs):**
- Password: `rig123`
- Beispiel: `elektriker.t208@rigcrew.com`

---

## 🔗 URLs (nach Deployment)

- Backend API: `https://cmms-erp-backend.onrender.com`
- Frontend: `https://cmms-erp-frontend.onrender.com` (oder dein Wunschname)
- Database: Intern über Render (private connection)

---

## ⚠️ Wichtige Hinweise

1. **Free Tier Limitation:**
   - Services schlafen nach 15 Min Inaktivität
   - Erster Request nach Sleep dauert ~30 Sekunden (Cold Start)
   - Für Production: Upgrade auf Starter Plan ($7/Monat)

2. **Database Backups:**
   - Free Tier: 90 Tage Retention
   - Regelmäßige manuelle Backups empfohlen

3. **CORS Update:**
   - Nach Frontend-Deployment die Frontend-URL in CORS_ORIGIN eintragen!

4. **Monitoring:**
   - Render bietet Logs & Metrics im Dashboard
   - Bei Errors: Backend Logs checken

---

## 🎯 Nächste Schritte für Montag-Präsentation

1. ✅ PostgreSQL Setup - ERLEDIGT
2. ✅ JWT Secrets - ERLEDIGT
3. ⏳ Backend deployen (ca. 5-10 Min)
4. ⏳ Frontend deployen (ca. 5-10 Min)
5. ⏳ CORS_ORIGIN updaten
6. ⏳ Testen: Login, Chatbot, Projekte erstellen
7. ✅ Präsentation vorbereiten

**Geschätzte Zeit bis Production-Ready:** 20-30 Minuten
