# 🔍 Notification Debug Guide

## Problem: Keine Notification erhalten nach Failure Report

### ✅ Was wir wissen:

- Backend LOG zeigt: **"Created 1 notifications for managers"** ✅
- Das bedeutet: Backend hat die Notification erstellt!

---

## 🎯 Mögliche Ursachen:

### 1. Du bist als MANAGER eingeloggt

**Problem:** Wenn du selbst Manager bist und den Failure Report erstellst, erhältst du keine Notification von dir selbst.

**Lösung:**

- Logge dich als **Regular User** (z.B. `philip@rigcrew.com`) ein
- Erstelle einen Failure Report
- Logge dich als **Manager** ein
- Prüfe die NotificationBell

---

### 2. Kein aktiver Manager-User vorhanden

**Problem:** Es gibt keinen User mit `role='MANAGER'`, `isActive=true`, `approvalStatus='APPROVED'`

**Prüfen:**

1. Öffne: http://localhost:5555 (Prisma Studio sollte laufen)
2. Gehe zu **User** Tabelle
3. Suche nach User mit:
   - `role` = `MANAGER`
   - `isActive` = `true`
   - `approvalStatus` = `APPROVED`

**Wenn kein Manager existiert:**

- Gehe zu **User Management** in der App
- Erstelle einen neuen User mit Role `MANAGER`
- Oder ändere einen existierenden User zu `MANAGER`

---

### 3. Frontend ruft Notifications nicht ab

**Problem:** API-Call schlägt fehl oder wird nicht ausgeführt

**Debug-Schritte:**

1. Öffne Browser DevTools (F12)
2. Gehe zum **Console** Tab
3. Suche nach: `🔔 Notifications loaded:`
4. Prüfe die Daten:
   ```javascript
   {
     total: X,      // Anzahl geladener Notifications
     unread: X,     // Anzahl ungelesener
     notifications: [...] // Array mit Notifications
   }
   ```

**Wenn nichts erscheint:**

- Gehe zum **Network** Tab
- Filter auf: `notifications`
- Prüfe ob Request erfolgreich ist (Status 200)
- Prüfe Response-Body

---

## 🧪 Test-Szenario:

### Schritt 1: User-Rollen prüfen

```
1. Öffne App als Admin
2. Gehe zu User Management
3. Prüfe welche User MANAGER sind
4. Notiere Manager-Email (z.B. manager@rigcrew.com)
```

### Schritt 2: Failure Report erstellen

```
1. Logge dich als REGULAR USER ein (nicht Manager!)
2. Gehe zu "Failure Reports"
3. Erstelle neuen Report:
   - Titel: "Test Notification"
   - Plant: T208
   - Severity: HIGH
4. Submit
```

### Schritt 3: Als Manager einloggen

```
1. Logout
2. Login als MANAGER (Email aus Schritt 1)
3. Prüfe Bell-Icon in Header
4. Badge sollte "1" zeigen
5. Klicke Bell → Notification sollte erscheinen
```

---

## 🔧 Quick-Fix: Manager-User erstellen

**SQL Command (in Prisma Studio):**

```sql
-- Finde Admin-User
SELECT id, email, role FROM User WHERE role = 'ADMIN';

-- Ändere einen User zu Manager
UPDATE User
SET role = 'MANAGER'
WHERE email = 'manager@rigcrew.com';
```

**Oder in der App:**

1. Login als Admin
2. User Management
3. User bearbeiten
4. Role auf "MANAGER" setzen
5. Save

---

## 📊 Backend Log Interpretation

```
"Created 1 notifications for managers"
```

Das bedeutet:

- ✅ Backend findet 1 Manager
- ✅ Notification wurde erstellt
- ✅ In DB gespeichert

**Prüfe in Prisma Studio:**

1. Öffne **Notification** Tabelle
2. Sortiere nach `createdAt` (neueste zuerst)
3. Neueste Notification:
   - `type` = `FAILURE_REPORT`
   - `userId` = ID des Managers
   - `isRead` = `false`
   - `title` = "Neuer Schadensbericht: ..."

---

## ⚡ Sofort-Check (Console Commands)

**Im Browser Console:**

```javascript
// Prüfe aktuellen User
const user = JSON.parse(localStorage.getItem("user"));
console.log("Current User:", user);
console.log("Role:", user.role);

// Manuell Notifications abrufen
fetch("http://localhost:5137/api/notifications", {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
})
  .then((r) => r.json())
  .then((d) => console.log("Notifications:", d));
```

---

## 🎯 Erwartete Ausgabe

**Wenn alles funktioniert:**

```javascript
🔔 Notifications loaded: {
  total: 1,
  unread: 1,
  notifications: [{
    id: "...",
    type: "FAILURE_REPORT",
    title: "Neuer Schadensbericht: Test Notification",
    message: "... hat einen HIGH Schaden in T208 gemeldet...",
    isRead: false,
    createdAt: "2025-10-23T..."
  }]
}
```

**Badge am Bell-Icon:** `1`  
**Popover:** Notification sichtbar mit ⚠️ Icon

---

## ❌ Häufige Fehler

### "Token expired" im Network Tab

**Lösung:** Logout → Login

### "404 Not Found" bei /api/notifications

**Lösung:** Backend neu starten

### Badge zeigt 0 trotz Notification in DB

**Lösung:**

1. Hard Refresh (Ctrl+Shift+R)
2. LocalStorage leeren
3. Neu einloggen

---

## 📞 Support

**Log-Dateien prüfen:**

- Backend Console (Terminal mit `npm run dev`)
- Browser DevTools Console
- Network Tab in DevTools

**Wichtige Informationen für Debug:**

- Welcher User ist eingeloggt? (Email, Role)
- Was zeigt Browser Console?
- Was zeigt Backend Terminal?
- Gibt es Manager-User in DB?
