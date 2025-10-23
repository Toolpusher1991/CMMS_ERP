# 📋 TODO Liste - CMMS/ERP App

**Stand:** 21. Oktober 2025  
**Projekt-Status:** ✅ 80% Produktionsreif

---

## 🔴 KRITISCH - Vor Production MUSS behoben werden

### 1. **Datenbank Migration: SQLite → PostgreSQL** ⚠️ HÖCHSTE PRIORITÄT

- [ ] PostgreSQL Cloud-Instanz einrichten (Supabase/Railway/Render)
- [ ] DATABASE_URL in `.env` aktualisieren
- [ ] Prisma Migration ausführen: `npx prisma migrate deploy`
- [ ] Seed-Script auf neuer DB ausführen
- [ ] Verbindung testen

**Warum kritisch?**

- SQLite = nur Development, keine Concurrency
- Produktions-DB muss PostgreSQL/MySQL sein
- Datenverlust-Risiko bei SQLite

**Zeit:** ~30 Minuten  
**Anleitung:** Siehe `PRODUKTIONSREIFE_STATUS.md` Punkt 1

---

### 2. **JWT Secret ändern** ⚠️ KRITISCH

- [ ] Starkes Secret generieren: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] In `backend/.env` eintragen
- [ ] Backend neu starten

**Zeit:** 2 Minuten

---

### 3. **HTTPS/SSL Setup** ⚠️ KRITISCH

- [ ] Domain registrieren (falls noch nicht vorhanden)
- [ ] Let's Encrypt Zertifikat einrichten
- [ ] Nginx/Caddy als Reverse Proxy konfigurieren
- [ ] HTTP → HTTPS Redirect

**Zeit:** ~1 Stunde  
**Anleitung:** Siehe `PRODUKTIONSREIFE_STATUS.md` Punkt 5

---

### 4. **Environment Configuration für Production** ⚠️ WICHTIG

- [ ] `NODE_ENV=production` setzen
- [ ] `CORS_ORIGIN` auf Production-Domain ändern
- [ ] `LOG_LEVEL=warn` setzen
- [ ] Alle Secrets aus `.env` in sicheren Secrets-Manager

**Zeit:** 10 Minuten

---

### 5. **Dependency Vulnerabilities behandeln** ⚠️ WICHTIG

**Frontend:**

- [ ] `xlsx` Library (HIGH Severity - Prototype Pollution)
  - Option A: Alternative Library `exceljs` verwenden
  - Option B: Server-side Excel-Processing implementieren
  - Option C: Risiko akzeptieren (nur Admin-Zugriff)

**Backend:**

- [ ] `validator.js` (MODERATE Severity - URL bypass)
  - Option A: Update abwarten
  - Option B: Custom URL-Validation implementieren
  - Option C: Akzeptabel für MVP (nicht kritisch)

**Zeit:** 1-2 Stunden (je nach Option)

---

## 🟡 WICHTIG - Sollte vor Production implementiert werden

### 6. **Testing implementieren** (Aktuell: 0%)

- [ ] Jest/Vitest Setup
- [ ] Unit Tests für Auth Controller
  - [ ] Login Test (korrekte Credentials)
  - [ ] Login Test (falsche Credentials)
  - [ ] Token Refresh Test
  - [ ] Registration Test
- [ ] Integration Tests für User CRUD
- [ ] E2E Test für Login-Flow

**Zeit:** 4-6 Stunden  
**Warum wichtig?** Verhindert Regressions-Bugs bei Updates

---

### 7. **Monitoring & Error Tracking**

- [ ] Sentry für Error-Tracking installieren
  - [ ] Frontend: `@sentry/react`
  - [ ] Backend: `@sentry/node`
- [ ] Uptime-Monitoring (UptimeRobot/Pingdom)
- [ ] Log-Aggregation (optional: ELK Stack)

**Zeit:** 1-2 Stunden

---

### 8. **Backup-Strategie**

- [ ] Automatische PostgreSQL-Backups einrichten
- [ ] Backup-Script für Cron-Job erstellen
- [ ] Off-site Storage (S3/Cloud Storage)
- [ ] Restore-Prozedur testen

**Zeit:** 2-3 Stunden

---

### 9. **Production Build & Deployment**

- [ ] Frontend Production Build: `npm run build`
- [ ] Backend Production Build: `npm run build`
- [ ] PM2 für Process Management installieren
- [ ] Auto-Start bei Server-Reboot konfigurieren
- [ ] Health-Check Endpoint testen

**Zeit:** 1 Stunde

---

## 🟢 FEATURE REQUESTS - Nice-to-Have

### 10. **Excel → Action Tracker Integration** 🆕

- [ ] **Option 1:** Manueller "Als Action erstellen" Button (30 Min)
- [ ] **Option 2:** Batch-Import mit Mapping (2 Std)
- [ ] **Option 2.5:** Smart Batch-Import mit Backend (3-4 Std) ⭐ EMPFOHLEN
- [ ] **Option 3:** Auto-Sync mit Regeln (4-6 Std)
- [ ] **Option 4:** Live-Sync mit Excel als Datenquelle (2-3 Tage)

**Status:** Konzept erstellt, wartet auf Entscheidung  
**Siehe:** Vorherige Nachricht für Details zu allen Optionen

---

### 11. **T350 Rig hinzufügen**

- [ ] T350 (Mittlere Leistung) zum Action Tracker hinzufügen
- [ ] In Seed-Script bereits vorhanden ✅
- [ ] Nur Frontend-Dropdown aktualisieren nötig

**Zeit:** 5 Minuten

---

### 12. **API-Dokumentation**

- [ ] Swagger/OpenAPI Setup
- [ ] API-Endpoints dokumentieren
- [ ] Beispiel-Requests hinzufügen
- [ ] Authentication Flow dokumentieren

**Zeit:** 3-4 Stunden

---

### 13. **Docker Setup**

- [ ] Dockerfile für Backend erstellen
- [ ] Dockerfile für Frontend erstellen
- [ ] docker-compose.yml für Full-Stack Setup
- [ ] Multi-stage Build für optimierte Images

**Zeit:** 2-3 Stunden

---

### 14. **CI/CD Pipeline**

- [ ] GitHub Actions für Auto-Testing
- [ ] GitHub Actions für Auto-Deploy
- [ ] Staging-Environment einrichten
- [ ] Production-Deploy-Workflow

**Zeit:** 4-6 Stunden

---

### 15. **Performance-Optimierung**

- [ ] Database-Indizes optimieren
- [ ] Redis Caching-Layer hinzufügen
- [ ] Frontend Code-Splitting
- [ ] Image-Optimierung
- [ ] CDN für Static Assets (Cloudflare)

**Zeit:** 1-2 Tage

---

### 16. **Security-Enhancements**

- [ ] Two-Factor Authentication (2FA)
- [ ] Session Management (aktive Sessions anzeigen)
- [ ] "Logout all devices" Feature
- [ ] CSRF Protection
- [ ] Content Security Policy (CSP) verschärfen
- [ ] Rate Limiting anpassen (je nach Traffic)

**Zeit:** 1-2 Tage

---

### 17. **User Experience Verbesserungen**

- [ ] Loading-States überall konsistent
- [ ] Error Boundaries für React
- [ ] Offline-Mode (PWA Enhancement)
- [ ] Dark/Light Mode Toggle
- [ ] Keyboard Shortcuts
- [ ] Bulk-Actions (mehrere löschen/bearbeiten)

**Zeit:** 2-3 Tage

---

### 18. **Mobile Optimization**

- [ ] Responsive Design für alle Pages prüfen
- [ ] Touch-Gesten für Mobile
- [ ] Mobile Navigation optimieren
- [ ] PWA Manifest verbessern

**Zeit:** 1-2 Tage

---

### 19. **Reporting & Analytics**

- [ ] Dashboard mit KPIs
- [ ] Action Tracker Analytics
- [ ] Work Order Reports
- [ ] Export zu PDF/Excel
- [ ] Grafiken & Charts (Chart.js/Recharts)

**Zeit:** 3-4 Tage

---

### 20. **Multi-Language Support (i18n)**

- [ ] i18next Setup
- [ ] Deutsch & Englisch
- [ ] Language-Switcher im UI
- [ ] Übersetzungen für alle Texte

**Zeit:** 2-3 Tage

---

## ✅ ERLEDIGT - Bereits implementiert

- [x] Backend: JWT Authentication mit Refresh Tokens
- [x] Backend: Role-Based Access Control (ADMIN/USER)
- [x] Backend: Bcrypt Password Hashing
- [x] Backend: Rate Limiting
- [x] Backend: Security Headers (Helmet.js)
- [x] Backend: Prisma ORM mit SQLite (Dev-DB)
- [x] Backend: CORS Configuration
- [x] Backend: Winston Logging
- [x] Backend: Account Lockout System
- [x] Backend: Rig & Equipment CRUD-Endpunkte
- [x] Backend: Seed-Script mit 5 Rigs
- [x] Frontend: React + TypeScript + Vite
- [x] Frontend: shadcn/ui Component Library
- [x] Frontend: TailwindCSS
- [x] Frontend: Dark Mode Support
- [x] Frontend: RigConfigurator mit Backend-Integration
- [x] Frontend: Action Tracker
- [x] Frontend: Work Order Management (Excel Import)
- [x] Frontend: User Management
- [x] Frontend: Project Management
- [x] Frontend: Auto Token Refresh
- [x] Frontend: File Upload Support
- [x] Dokumentation: SECURITY.md
- [x] Dokumentation: OWASP Assessment (95/100)
- [x] Dokumentation: Production Readiness Review
- [x] Dokumentation: Produktionsreife-Status
- [x] Git: Repository initialisiert & gepusht
- [x] Git: Remote auf GitHub eingerichtet

---

## 📊 Prioritäten-Matrix

### Sofort (diese Woche):

1. ⚠️ PostgreSQL Migration
2. ⚠️ JWT Secret ändern
3. ⚠️ xlsx Vulnerability behandeln

### Nächste Woche:

4. HTTPS/SSL Setup
5. Environment Configuration
6. Testing (Basis-Tests)
7. Monitoring Setup

### Nächsten 2-4 Wochen:

8. Backup-Strategie
9. Production Deployment
10. Excel → Action Tracker Integration
11. API-Dokumentation
12. Docker Setup

### Future (Nice-to-Have):

13. CI/CD Pipeline
14. Performance-Optimierung
15. Security-Enhancements
16. UX-Verbesserungen
17. Mobile Optimization
18. Reporting & Analytics
19. Multi-Language Support

---

## 🎯 Nächster Schritt

**Was soll als Nächstes gemacht werden?**

**Option A: Production-Ready machen** (Kritische Punkte 1-5)  
→ Zeit: ~3-4 Stunden  
→ Danach: App ist produktionsbereit!

**Option B: Excel → Action Tracker Feature** (Punkt 10)  
→ Zeit: 30 Min - 4 Std (je nach Option)  
→ Sofort nutzbar!

**Option C: Testing implementieren** (Punkt 6)  
→ Zeit: 4-6 Stunden  
→ Langfristig wichtig!

---

## 📞 Entscheidung

**Welcher Punkt soll als Nächstes angegangen werden?**

Sagen Sie einfach die Nummer (z.B. "Punkt 10 Option 2.5") und ich starte mit der Implementierung! 🚀
