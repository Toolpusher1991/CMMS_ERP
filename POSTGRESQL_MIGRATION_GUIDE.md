# 🎯 PostgreSQL Migration - Render.com Setup

**Status:** ⏳ In Bearbeitung  
**Ziel:** SQLite → PostgreSQL Migration

---

## ✅ Schritt 1: PostgreSQL auf Render erstellen

1. **Gehe zu:** https://dashboard.render.com
2. **Klicke:** "New +" → "PostgreSQL"
3. **Einstellungen:**
   ```
   Name:     cmms-erp-db
   Database: cmms_erp
   User:     cmms_user (automatisch)
   Region:   Frankfurt (EU)
   Plan:     Free
   ```
4. **Klicke:** "Create Database"
5. **Warten** bis Status = "Available" (1-2 Minuten)

---

## ✅ Schritt 2: Connection String kopieren

Auf der Database-Seite (nach Erstellung):

1. Scrolle zu **"Connections"**
2. Kopiere die **"External Database URL"**

Beispiel-Format:

```
postgresql://cmms_user:RQn...@dpg-xxxxx-a.frankfurt-postgres.render.com/cmms_erp
```

---

## ✅ Schritt 3: Database URL in .env einfügen

**BEREITS VORBEREITET!** ✅

Öffne: `backend/.env`

Ersetze diese Zeile:

```env
DATABASE_URL="postgresql://cmms_user:DEIN_PASSWORD@dpg-xxxxx-a.frankfurt-postgres.render.com/cmms_erp"
```

Mit deiner kopierten URL von Render!

---

## ✅ Schritt 4: Prisma Schema aktualisiert

**BEREITS ERLEDIGT!** ✅

`backend/prisma/schema.prisma` wurde von `sqlite` auf `postgresql` umgestellt.

---

## 🚀 Schritt 5: Migration ausführen

**Nachdem du die DATABASE_URL in .env eingefügt hast:**

```bash
cd backend
npx prisma migrate dev --name init_postgresql
```

Das wird:

1. ✅ Verbindung zu PostgreSQL testen
2. ✅ Alle Tabellen erstellen
3. ✅ Prisma Client neu generieren

---

## 🌱 Schritt 6: Datenbank mit Daten füllen (Seed)

```bash
npx tsx prisma/seed.ts
```

Das erstellt:

- ✅ Admin User (admin@example.com / admin123)
- ✅ Test User (user@example.com / user123)
- ✅ 4 Projects (T208, T207, T700, T46)
- ✅ 5 Rigs (T700, T46, T350, T208, T207)

---

## 🧪 Schritt 7: Backend neu starten & testen

```bash
npm run dev
```

Erwartete Ausgabe:

```
🚀 Server is running on http://localhost:3000
🌐 Network: http://0.0.0.0:3000
📊 Environment: development
```

**Test:**

```bash
curl http://localhost:3000/api/rigs
```

Sollte JSON mit 5 Rigs zurückgeben!

---

## ✅ Schritt 8: Frontend testen

1. Backend läuft ✅
2. Frontend starten: `npm run dev` (im Root)
3. Browser: http://localhost:5174
4. Login mit: `admin@example.com` / `admin123`
5. Gehe zu **Bohranlagen** → Sollte 5 Rigs zeigen!

---

## 🎉 Fertig!

Nach diesen Schritten:

- ✅ PostgreSQL auf Render läuft
- ✅ App nutzt Production-DB
- ✅ Alle Daten migriert
- ✅ Bereit für Deployment!

---

## 🔧 Troubleshooting

### Problem: "Can't reach database server"

**Lösung:**

- Prüfe DATABASE_URL in `.env`
- Stelle sicher, dass keine Leerzeichen in der URL sind
- Render Dashboard: Database Status = "Available"?

### Problem: "Error: P1001: Can't connect"

**Lösung:**

- Firewall/VPN aktiv? Render benötigt ausgehende Verbindungen
- Teste URL mit: `psql "postgresql://..."`

### Problem: Migration schlägt fehl

**Lösung:**

```bash
# Reset & neu versuchen
npx prisma migrate reset
npx prisma migrate dev --name init_postgresql
```

---

## 📊 Nächste Schritte nach Migration

1. ✅ JWT Secret ändern (siehe TODO.md Punkt 2)
2. ✅ HTTPS einrichten (siehe TODO.md Punkt 3)
3. ✅ Production Build erstellen
4. ✅ Auf Render deployen

---

## 💡 Render Database Features (Free Tier)

- ✅ 256 MB RAM
- ✅ 1 GB Storage
- ✅ Automatische Backups (7 Tage)
- ✅ SSL/TLS Verbindungen
- ✅ 90 Tage kostenlos, dann $7/Monat

**Upgrade später möglich!**

---

## 🆘 Hilfe benötigt?

Wenn ein Schritt nicht funktioniert, sag mir:

1. Bei welchem Schritt (Nummer)
2. Welche Fehlermeldung erscheint
3. Screenshot (falls hilfreich)

**Ich helfe dir durch jeden Schritt! 🚀**
