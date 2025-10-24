# 🚨 Production-Kritische Setup-Punkte

**Status:** Pre-Production Checklist  
**Priorität:** KRITISCH - MUSS vor Go-Live  
**Geschätzte Zeit:** 2-3 Tage

---

## 1️⃣ SQLite → PostgreSQL Migration (MUSS)

### ❌ **Warum SQLite NICHT Production-Ready ist:**

#### **Problem 1: Concurrent Writes**

```
SQLite = File-based Database (eine einzige .db Datei)

Scenario:
- User A erstellt Action → Schreibt in dev.db
- User B erstellt gleichzeitig Failure Report → LOCKED! ⚠️
- User C lädt Notification → WARTET...

Ergebnis:
→ "Database is locked" Errors
→ Langsame Performance ab 10+ gleichzeitigen Usern
→ Write-Timeouts
```

**SQLite:** Gut für **1-5 User** (Development)  
**PostgreSQL:** Skaliert bis **10.000+ User** (Production)

#### **Problem 2: Keine Connection Pooling**

```javascript
// Aktuell (SQLite):
Jeder Request öffnet File → Liest → Schließt File
= LANGSAM! 🐌

// PostgreSQL:
Connection Pool = 10-20 offene Connections
Request benutzt existierende Connection
= SCHNELL! ⚡
```

#### **Problem 3: Backup & Recovery**

```
SQLite Backup:
- Kopiere dev.db Datei (während App läuft = GEFÄHRLICH)
- Korrupte Datei wenn während Write kopiert
- Keine Point-in-Time Recovery

PostgreSQL Backup:
- pg_dump (sicher während Betrieb)
- Continuous Archiving (WAL)
- Point-in-Time Recovery (z.B. "vor 2 Stunden")
- Automatische Backups (Render, Supabase)
```

#### **Problem 4: Data Integrity**

```sql
-- SQLite: Schwache Foreign Key Enforcement
PRAGMA foreign_keys = ON; -- Muss manuell aktiviert werden!

-- PostgreSQL: Strenge Constraints
ALTER TABLE actions
  ADD CONSTRAINT fk_user
  FOREIGN KEY (userId) REFERENCES users(id)
  ON DELETE CASCADE; -- Automatisch enforced
```

---

### ✅ **Lösung: PostgreSQL Migration**

#### **Schritt 1: PostgreSQL Database erstellen**

##### **Option A: Render.com (Empfohlen)**

```
1. Gehe zu: https://render.com
2. Sign Up mit GitHub
3. Dashboard → "New +" → "PostgreSQL"
4. Name: maintAIn-db
5. Database: maintAIn
6. User: maintAIn_user
7. Region: Frankfurt (EU-Central)
8. Plan: Starter ($7/Monat)
   ✅ 1 GB Storage
   ✅ Automatische Backups (7 Tage)
   ✅ SSL Connection
   ✅ 97 Connections

9. Create Database

10. Kopiere "External Database URL":
   postgresql://maintAIn_user:xyz...@dpg-abc123.frankfurt-postgres.render.com/maintAIn
```

##### **Option B: Supabase (Free Tier)**

```
1. Gehe zu: https://supabase.com
2. Sign Up
3. "New Project"
4. Organization: Dein Name
5. Name: maintAIn
6. Database Password: [starkes Passwort]
7. Region: Frankfurt
8. Plan: Free
   ✅ 500 MB Storage
   ✅ 1 GB Transfer
   ✅ 50 MB File Storage
   ✅ SSL Connection

9. Settings → Database → Connection String:
   postgresql://postgres:password@db.xyz.supabase.co:5432/postgres
```

#### **Schritt 2: .env Update**

```bash
# backend/.env

# ALT (SQLite):
# DATABASE_URL="file:./prisma/dev.db"

# NEU (PostgreSQL - Render):
DATABASE_URL="postgresql://maintAIn_user:xyz123@dpg-abc.frankfurt-postgres.render.com/maintAIn?sslmode=require"

# ODER (Supabase):
DATABASE_URL="postgresql://postgres:yourpassword@db.xyz.supabase.co:5432/postgres?sslmode=require"
```

#### **Schritt 3: Prisma Schema Update**

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // ← ÄNDERN von "sqlite"
  url      = env("DATABASE_URL")
}

// Modelle bleiben GLEICH! 🎉
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  // ... rest bleibt gleich
}
```

#### **Schritt 4: Migration durchführen**

```powershell
# 1. Alte SQLite-Daten exportieren (optional - für Backup)
cd backend
npx prisma db pull --schema=prisma/schema.prisma

# 2. Schema auf "postgresql" umstellen (siehe oben)

# 3. Prisma Client neu generieren
npx prisma generate

# 4. Neue PostgreSQL Database initialisieren
npx prisma db push

# Ausgabe:
# ✔ Generated Prisma Client
# ✔ Database schema created successfully

# 5. Test-Daten erstellen (optional)
npx tsx prisma/seed.ts

# 6. Überprüfen
npx prisma studio
# Öffnet http://localhost:5555 mit GUI
```

#### **Schritt 5: Connection Pooling (Prisma Accelerate)**

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection Pooling aktivieren
  relationMode = "prisma"
}
```

```typescript
// backend/src/index.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],

  // Connection Pool Konfiguration
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection Pool Settings
prisma.$connect();

// Graceful Shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

---

### 📊 **Vergleich: SQLite vs PostgreSQL**

| Feature                | SQLite        | PostgreSQL       |
| ---------------------- | ------------- | ---------------- |
| **Max Users**          | 1-5           | 10.000+          |
| **Concurrent Writes**  | ❌ Eine       | ✅ Unbegrenzt    |
| **Connection Pooling** | ❌ Nein       | ✅ Ja            |
| **Backup**             | ⚠️ File-Copy  | ✅ pg_dump, WAL  |
| **Recovery**           | ❌ Nein       | ✅ Point-in-Time |
| **Constraints**        | ⚠️ Schwach    | ✅ Streng        |
| **Skalierung**         | ❌ File-based | ✅ Horizontal    |
| **Kosten**             | $0            | $0-7/Monat       |
| **Setup**              | ⭐ Easy       | ⭐⭐ Medium      |

**Fazit:** PostgreSQL ist der Industry-Standard für Production!

---

## 2️⃣ HTTPS Setup (MUSS)

### ❌ **Warum HTTP NICHT sicher ist:**

#### **Problem 1: Unverschlüsselte Daten**

```
HTTP (Aktuell):
Browser → [email] → [password] → Server
              ↓
         ⚠️ KLARTEXT! Jeder kann mitlesen!

Hacker im selben WiFi:
- Sieht alle Passwörter
- Kann Session-Tokens stehlen
- Man-in-the-Middle Attack möglich

HTTPS:
Browser → [encrypted data] → Server
              ↓
         ✅ AES-256 verschlüsselt
         Hacker sieht nur: 6#$@!*&^%
```

#### **Problem 2: Session Hijacking**

```javascript
// HTTP Request (sichtbar):
GET /api/actions HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
              ↑
         ⚠️ Token gestohlen!

Hacker kopiert Token → Ist jetzt eingeloggt als DU!
```

#### **Problem 3: Browser-Warnungen**

```
Chrome bei HTTP:
┌─────────────────────────────────┐
│ ⚠️ Nicht sicher                  │
│ http://maintAIn.com              │
│                                  │
│ Diese Website ist nicht sicher.  │
│ Geben Sie keine sensiblen Daten  │
│ ein (Passwörter, Kreditkarten)   │
└─────────────────────────────────┘

User denkt: "Unseriös!" → Verlässt Seite
```

#### **Problem 4: PWA & Service Worker**

```javascript
// Service Worker (für Offline-Support)
if ('serviceWorker' in navigator) {
  // ❌ Funktioniert NUR mit HTTPS!
  navigator.serviceWorker.register('/sw.js');
}

HTTP = Keine PWA Features!
- Kein "Add to Home Screen"
- Kein Offline-Modus
- Keine Push Notifications
```

---

### ✅ **Lösung: HTTPS aktivieren**

#### **Option A: Automatisch via Render/Vercel (EINFACH)**

##### **Backend (Render.com):**

```
1. Deploy Backend zu Render:

   Render Dashboard:
   - New + → Web Service
   - Connect GitHub Repository
   - Name: maintAIn-backend
   - Environment: Node
   - Build Command: npm install && npm run build
   - Start Command: npm start
   - Plan: Starter ($7/Monat)

2. Environment Variables:
   - DATABASE_URL = [PostgreSQL URL]
   - JWT_SECRET = [256-bit random]
   - OPENAI_API_KEY = sk-proj-...
   - NODE_ENV = production

3. Deploy!

4. Render gibt dir:
   ✅ https://maintAIn-backend.onrender.com
   ✅ Automatisches SSL-Zertifikat (Let's Encrypt)
   ✅ Auto-Renewal (kein Ablauf!)
   ✅ HTTPS Redirect (HTTP → HTTPS)
```

##### **Frontend (Vercel):**

```
1. Deploy Frontend zu Vercel:

   Vercel Dashboard:
   - Add New → Import Git Repository
   - Select: CMMS_ERP
   - Framework Preset: Vite
   - Build Command: npm run build
   - Output Directory: dist
   - Environment Variables:
     VITE_API_URL = https://maintAIn-backend.onrender.com

2. Deploy!

3. Vercel gibt dir:
   ✅ https://maintAIn.vercel.app
   ✅ Automatisches SSL (Let's Encrypt)
   ✅ Edge Network (weltweit schnell)
   ✅ Auto-Deploy bei Git Push
```

**Total Setup Zeit: 30 Minuten! ⚡**

#### **Option B: Eigene Domain (PROFESSIONELL)**

```
1. Domain kaufen (z.B. Namecheap, GoDaddy):
   - maintAIn.com (~$12/Jahr)

2. DNS Setup (Namecheap):

   A Record:
   @ → 76.76.21.21 (Render IP)

   CNAME:
   www → cname.vercel-dns.com

   CNAME:
   api → maintAIn-backend.onrender.com

3. Render Custom Domain:
   Settings → Custom Domain
   → api.maintAIn.com
   → Verify DNS
   → ✅ HTTPS aktiviert!

4. Vercel Custom Domain:
   Settings → Domains
   → maintAIn.com
   → www.maintAIn.com
   → ✅ HTTPS aktiviert!

Ergebnis:
✅ https://maintAIn.com (Frontend)
✅ https://api.maintAIn.com (Backend)
```

#### **Schritt: Code-Anpassungen**

```typescript
// backend/src/index.ts

import express from "express";
import helmet from "helmet";

const app = express();

// 1. Helmet für Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 Jahr
      includeSubDomains: true,
      preload: true,
    },
  })
);

// 2. HTTPS Redirect (nur wenn nicht hinter Proxy)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

// 3. Secure Cookies
app.use(
  session({
    cookie: {
      secure: true, // ← Nur HTTPS
      httpOnly: true, // ← Kein JavaScript-Zugriff
      sameSite: "strict", // ← CSRF Protection
      maxAge: 24 * 60 * 60 * 1000, // 24h
    },
  })
);
```

```typescript
// src/services/api.ts (Frontend)

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5137";

// Nur HTTPS in Production erlauben
if (import.meta.env.PROD && !API_URL.startsWith("https://")) {
  throw new Error("Production requires HTTPS API URL!");
}

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Cookies mitsenden
});
```

---

### 🔒 **Security Headers Checklist**

```typescript
// backend/src/index.ts

app.use(
  helmet({
    // 1. Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.openai.com"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // TailwindCSS
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [], // HTTP → HTTPS
      },
    },

    // 2. HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 Jahr
      includeSubDomains: true,
      preload: true,
    },

    // 3. X-Frame-Options (Clickjacking Protection)
    frameguard: {
      action: "deny",
    },

    // 4. X-Content-Type-Options
    noSniff: true,

    // 5. Referrer-Policy
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  })
);
```

**Test HTTPS Security:**

```
https://securityheaders.com
→ Gebe deine URL ein
→ Ergebnis: A+ Rating ✅
```

---

## 3️⃣ Error Monitoring (MUSS)

### ❌ **Warum console.log NICHT reicht:**

#### **Problem 1: Keine Persistenz**

```javascript
// Aktuell:
try {
  await createAction(data);
} catch (error) {
  console.error('Action creation failed:', error);
  // ↑ Ausgabe im Terminal... dann weg! 💨
}

Production Scenario:
- 3:00 AM: Error passiert
- User schreibt: "Ich kann keine Action erstellen!"
- Du checkst Logs: ... nichts! (Terminal wurde geleert)
- Du weißt nicht: WARUM? WANN? WER?
```

#### **Problem 2: Kein Context**

```javascript
console.error('Error:', error.message);
// Ausgabe: "Database connection failed"

Fehlende Infos:
- Welcher User? 🤷
- Welche Route? 🤷
- Welcher Browser? 🤷
- Stack Trace? 🤷
- Vorherige Requests? 🤷
```

#### **Problem 3: Keine Alerts**

```javascript
// Kritischer Fehler:
Database.connect() → FAILED!

Aktuell:
- console.error() → Terminal
- Du schläfst 😴
- User können nichts machen
- 8 Stunden später checkst du Server
- 100+ User betroffen! 😱

Mit Monitoring:
- Error → Sentry
- Sentry → Email/SMS an dich
- Du fixst innerhalb 10 Minuten ⚡
```

#### **Problem 4: Keine Statistiken**

```
Fragen die du nicht beantworten kannst:
- Wie oft failed User-Login pro Tag?
- Welche Route hat meiste Errors?
- Wie viele Users betroffen?
- Gibt es Patterns? (z.B. nur Safari Browser?)
```

---

### ✅ **Lösung: Sentry Error Monitoring**

#### **Schritt 1: Sentry Account erstellen**

```
1. Gehe zu: https://sentry.io
2. Sign Up (GitHub empfohlen)
3. Create Project:
   - Platform: Node.js (für Backend)
   - Alert Frequency: On every new issue
   - Project Name: maintAIn-backend

4. Kopiere DSN:
   https://abc123@o456.ingest.sentry.io/789

5. Wiederhole für Frontend:
   - Platform: React
   - Project Name: maintAIn-frontend
   - DSN: https://xyz456@o789.ingest.sentry.io/123
```

**Free Tier:**

- ✅ 5.000 Events/Monat
- ✅ 1 User
- ✅ Email Alerts
- ✅ 30 Tage Retention
- ✅ Performance Monitoring (Basic)

#### **Schritt 2: Backend Integration**

```bash
# Installation
cd backend
npm install @sentry/node @sentry/profiling-node
```

```typescript
// backend/src/index.ts

import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

// Sentry initialisieren (GANZ AM ANFANG!)
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  environment: process.env.NODE_ENV || "development",

  // Release Tracking
  release: "maintAIn@1.0.0",

  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% in Dev, 0.1 in Prod (10%)

  // Profiling
  profilesSampleRate: 1.0,

  integrations: [new ProfilingIntegration()],

  // Sensitive Data Filter
  beforeSend(event, hint) {
    // Passwords entfernen
    if (event.request?.data) {
      const data = event.request.data;
      if (data.password) data.password = "[FILTERED]";
      if (data.newPassword) data.newPassword = "[FILTERED]";
    }
    return event;
  },
});

const app = express();

// Sentry Request Handler (NACH app.use(express.json()))
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... deine Routes ...

// Sentry Error Handler (VOR anderen Error Handlers!)
app.use(Sentry.Handlers.errorHandler());

// Custom Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Error ist bereits an Sentry gesendet!

  console.error("Error:", err);

  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});
```

```bash
# backend/.env

SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
```

#### **Schritt 3: Frontend Integration**

```bash
# Installation
npm install @sentry/react
```

```typescript
// src/main.tsx

import * as Sentry from "@sentry/react";

// Sentry initialisieren (VOR ReactDOM.render!)
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,

  environment: import.meta.env.MODE,

  integrations: [
    // Browser Tracing
    Sentry.browserTracingIntegration(),

    // Replay (User Sessions aufzeichnen bei Errors)
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Session Replay bei Errors
  replaysSessionSampleRate: 0.1, // 10% normale Sessions
  replaysOnErrorSampleRate: 1.0, // 100% bei Errors

  // Custom User Context
  beforeSend(event, hint) {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      event.user = {
        id: userData.id,
        email: userData.email,
        username: userData.name,
      };
    }
    return event;
  },
});

// App mit Error Boundary wrappen
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
```

```typescript
// src/components/ErrorFallback.tsx

export function ErrorFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Etwas ist schiefgelaufen 😔</h1>
        <p className="mb-4">Der Fehler wurde automatisch gemeldet.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Seite neu laden
        </button>
      </div>
    </div>
  );
}
```

```env
# .env

VITE_SENTRY_DSN=https://xyz456@o789.ingest.sentry.io/123
```

#### **Schritt 4: Custom Error Tracking**

```typescript
// backend/src/controllers/action.controller.ts

import * as Sentry from "@sentry/node";

export const createAction = async (req: Request, res: Response) => {
  try {
    const action = await prisma.action.create({
      data: req.body,
    });

    // Success Breadcrumb
    Sentry.addBreadcrumb({
      category: "action",
      message: "Action created successfully",
      level: "info",
      data: { actionId: action.id },
    });

    res.json(action);
  } catch (error) {
    // Error Context hinzufügen
    Sentry.withScope((scope) => {
      scope.setContext("action_data", {
        title: req.body.title,
        plant: req.body.plant,
        assignedTo: req.body.assignedTo,
      });

      scope.setUser({
        id: req.user.id,
        email: req.user.email,
      });

      scope.setTag("feature", "action-creation");
      scope.setLevel("error");

      // Error an Sentry senden
      Sentry.captureException(error);
    });

    res.status(500).json({ error: "Action creation failed" });
  }
};
```

```typescript
// src/services/api.ts (Frontend)

import * as Sentry from "@sentry/react";

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // API Errors an Sentry
    Sentry.captureException(error, {
      contexts: {
        api: {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
        },
      },
    });

    return Promise.reject(error);
  }
);
```

#### **Schritt 5: Alert Configuration**

```
Sentry Dashboard:

1. Settings → Alerts → New Alert Rule

2. Conditions:
   - When: The issue is first seen
   - And: The event level is equal to error or fatal

3. Then:
   - Send notification via Email
   - To: deine@email.com

4. Weitere Alerts:

   Alert 2: High Error Rate
   - When: Error rate ≥ 10 errors/minute
   - Then: Send Email + SMS (optional)

   Alert 3: Database Errors
   - When: Issue contains "database"
   - Then: Send Email (High Priority)

   Alert 4: User Authentication
   - When: Issue tagged "auth-failure"
   - Then: Send Email
```

---

### 📊 **Sentry Dashboard Features**

#### **1. Error Overview**

```
Dashboard zeigt:
- 📈 Error Trends (24h, 7d, 30d)
- 👥 Betroffene User (Anzahl, %)
- 🔄 Frequency (wie oft pro Stunde)
- 📍 Browser/OS Distribution
- 🌍 Geographic Distribution
```

#### **2. Issue Details**

```
Klick auf Error zeigt:

Stack Trace:
  TypeError: Cannot read property 'id' of undefined
    at createAction (action.controller.ts:45)
    at /backend/src/routes/action.routes.ts:12
    at Layer.handle (express/lib/router/layer.js:95)

User Context:
  - Email: philip@rigcrew.com
  - ID: 1
  - IP: 192.168.1.50

Request Details:
  - URL: /api/actions
  - Method: POST
  - Body: { title: "Test", plant: "T208" }
  - Headers: { Authorization: "Bearer ..." }

Breadcrumbs (letzte 10 Actions):
  1. User logged in
  2. Fetched actions list
  3. Clicked "Create Action"
  4. Form submitted
  5. → ERROR!

Tags:
  - Environment: production
  - Release: 1.0.0
  - Browser: Chrome 120
  - OS: Windows 11
```

#### **3. Session Replay (bei Errors)**

```
Video-Aufzeichnung:
- Maus-Bewegungen
- Klicks
- Scroll-Verhalten
- Form-Eingaben (maskiert!)
- 30 Sekunden vor Error
→ Du siehst EXAKT was User gemacht hat!
```

#### **4. Performance Monitoring**

```
Transaction Overview:
- GET /api/actions → 120ms (Durchschnitt)
- POST /api/actions → 350ms
- GET /api/projects → 95ms

Slow Queries:
- SELECT * FROM actions WHERE ... → 2.5s ⚠️
  → Database Index fehlt!
```

---

### 🔔 **Alert Examples**

#### **Email bei Critical Error:**

```
Subject: [Sentry] Database Connection Failed - maintAIn-backend

A new issue was created in maintAIn-backend:

TypeError: connect ECONNREFUSED 127.0.0.1:5432
  at TCPConnectWrap.afterConnect

Environment: production
First Seen: 2025-10-23 14:32:15
Users Affected: 12
Events: 47 in last hour

View Issue: https://sentry.io/issues/123456

This issue affects:
- Chrome: 8 users
- Safari: 3 users
- Firefox: 1 user
```

#### **Slack/Discord Integration (optional):**

```
Settings → Integrations → Slack

Bei Error:
🔴 [Production] New Error in maintAIn-backend
   TypeError: Cannot read property 'id' of undefined
   👥 3 users affected
   🔗 View: https://sentry.io/...
```

---

## 🎯 **Implementierungs-Reihenfolge**

### **Tag 1: PostgreSQL Migration (4-6h)**

```
Vormittag:
✅ PostgreSQL Database erstellen (Render/Supabase)
✅ .env DATABASE_URL aktualisieren
✅ Prisma Schema anpassen (sqlite → postgresql)
✅ Migration durchführen (npx prisma db push)

Nachmittag:
✅ Test-Daten importieren (seed.ts)
✅ Backend lokal testen
✅ Connection Pooling konfigurieren
✅ Backup-Strategie dokumentieren
```

### **Tag 2: HTTPS + Deployment (6-8h)**

```
Vormittag:
✅ Backend zu Render deployen
✅ Environment Variables setzen
✅ Health Check verifizieren
✅ Helmet Security Headers

Nachmittag:
✅ Frontend zu Vercel deployen
✅ API_URL auf HTTPS umstellen
✅ SSL-Zertifikate verifizieren
✅ Custom Domain (optional)
```

### **Tag 3: Error Monitoring (3-4h)**

```
Vormittag:
✅ Sentry Account + Projects erstellen
✅ Backend Integration (@sentry/node)
✅ Frontend Integration (@sentry/react)
✅ Error Handlers implementieren

Nachmittag:
✅ Alerts konfigurieren
✅ Test-Errors senden
✅ Email-Benachrichtigungen prüfen
✅ Dokumentation schreiben
```

**Total: 2-3 Tage** (bei Vollzeit)  
**Oder: 1 Woche** (nebenbei)

---

## 💰 **Kosten-Übersicht**

| Service              | Plan           | Kosten/Monat | Kritisch       |
| -------------------- | -------------- | ------------ | -------------- |
| **PostgreSQL**       | Render Starter | $7           | ✅ MUSS        |
| **PostgreSQL**       | Supabase Free  | $0           | ✅ Alternative |
| **Backend Hosting**  | Render Starter | $7           | ✅ MUSS        |
| **Frontend Hosting** | Vercel Hobby   | $0           | ✅ MUSS        |
| **HTTPS/SSL**        | Let's Encrypt  | $0           | ✅ MUSS        |
| **Error Monitoring** | Sentry Free    | $0           | ✅ MUSS        |
| **Domain**           | .com Domain    | $1/Monat     | ⚠️ Optional    |

**Minimal Total: $7-14/Monat** (Supabase Free = $7, Render = $14)  
**Empfohlen: $14-15/Monat** (Render für DB + Backend)

---

## ✅ **Checkliste: Production-Ready**

### **Before Go-Live:**

- [ ] **PostgreSQL Migration**

  - [ ] Database erstellt (Render/Supabase)
  - [ ] DATABASE_URL aktualisiert
  - [ ] Prisma Schema auf `postgresql` umgestellt
  - [ ] Migration durchgeführt (`npx prisma db push`)
  - [ ] Test-Daten importiert
  - [ ] Connection Pooling konfiguriert
  - [ ] Backup-Job eingerichtet (automatisch bei Render)

- [ ] **HTTPS Setup**

  - [ ] Backend deployed zu Render/Fly.io
  - [ ] Frontend deployed zu Vercel/Netlify
  - [ ] SSL-Zertifikate aktiv (automatisch)
  - [ ] HTTPS Redirect konfiguriert
  - [ ] Helmet Security Headers aktiviert
  - [ ] API_URL auf HTTPS umgestellt
  - [ ] Cookies auf `secure: true` gesetzt

- [ ] **Error Monitoring**

  - [ ] Sentry Account erstellt
  - [ ] Backend Integration (@sentry/node)
  - [ ] Frontend Integration (@sentry/react)
  - [ ] DSN in .env gesetzt
  - [ ] Error Handlers implementiert
  - [ ] Email-Alerts konfiguriert
  - [ ] Test-Error gesendet & empfangen
  - [ ] Session Replay aktiviert

- [ ] **Testing**
  - [ ] Login funktioniert über HTTPS
  - [ ] Actions/Projekte erstellen funktioniert
  - [ ] File Upload funktioniert
  - [ ] Notifications werden angezeigt
  - [ ] Chatbot antwortet (OpenAI API)
  - [ ] Mobile Responsive OK

---

## 🚨 **Was passiert OHNE diese 3 Punkte?**

### **Ohne PostgreSQL:**

- ❌ "Database is locked" Errors ab 5+ Users
- ❌ Langsame Performance
- ❌ Datenverlust-Risiko (File Corruption)
- ❌ Keine Backups → Ein Fehler = ALLES WEG!

### **Ohne HTTPS:**

- ❌ Browser-Warnung: "Nicht sicher"
- ❌ User-Passwörter können gestohlen werden
- ❌ Session-Hijacking möglich
- ❌ Keine PWA-Features (Offline, Push)
- ❌ Google rankt HTTP-Sites schlechter (SEO)

### **Ohne Error Monitoring:**

- ❌ Du erfährst von Errors nur wenn User sich beschweren
- ❌ Keine Stack Traces → Debugging unmöglich
- ❌ Keine Alerts → Downtime von Stunden unbemerkt
- ❌ Keine Statistiken → Qualität sinkt unbemerkt

---

## 📚 **Weitere Ressourcen**

### **PostgreSQL:**

- [Render PostgreSQL Docs](https://render.com/docs/databases)
- [Supabase Quick Start](https://supabase.com/docs/guides/database)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

### **HTTPS/Deployment:**

- [Render Deployment Guide](https://render.com/docs/deploy-node-express-app)
- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
- [Let's Encrypt](https://letsencrypt.org/)

### **Sentry:**

- [Sentry Node.js Docs](https://docs.sentry.io/platforms/node/)
- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Best Practices](https://docs.sentry.io/product/best-practices/)

---

**Erstellt am:** 23. Oktober 2025  
**Status:** Production Checklist  
**Nächster Schritt:** PostgreSQL Migration starten!
