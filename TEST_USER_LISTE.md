# 👥 Test User Liste

## 🔐 Login Credentials

### **Admin Account** (Vollzugriff)

```
Email:    admin@example.com
Password: admin123
Rolle:    ADMIN
Status:   APPROVED & ACTIVE
```

**Berechtigungen:**

- ✅ Alle User sehen
- ✅ User erstellen/bearbeiten/löschen
- ✅ User genehmigen/ablehnen
- ✅ Passwörter ändern
- ✅ Accounts entsperren
- ✅ Statistiken sehen

---

### **Regular User** (Standard Benutzer)

```
Email:    user@example.com
Password: user123
Rolle:    USER
Status:   APPROVED & ACTIVE
```

**Berechtigungen:**

- ❌ Keine Admin-Funktionen
- ✅ Dashboard sehen
- ✅ Eigenes Profil (wenn implementiert)

---

## 🧪 Test-Szenarien

### **Szenario 1: Als Admin einloggen**

```bash
1. Gehe zu http://localhost:5173
2. Login mit admin@example.com / admin123
3. ✅ Du siehst Dashboard + "Benutzer" im Menü
4. Klicke "Benutzer" → Du siehst Enhanced User Admin Page
```

### **Szenario 2: User-Liste ansehen**

```bash
1. Im User Admin Tab "Alle Benutzer"
2. ✅ Siehst du 2 User:
   - Admin User (ADMIN, Aktiv)
   - Test User (USER, Aktiv)
3. Teste Suche: Tippe "admin" → Nur Admin User wird angezeigt
```

### **Szenario 3: Neuen User erstellen**

```bash
1. Klicke "Neuer Benutzer" Button
2. Fülle aus:
   Vorname:  Max
   Nachname: Mustermann
   Email:    max@test.de
   Password: Test123!@
   Rolle:    USER
3. Klicke "Erstellen"
4. ✅ User wird erstellt (Status: APPROVED)
5. Siehst du jetzt 3 User in der Liste
```

### **Szenario 4: Pending User erstellen (über API)**

```bash
# Terminal öffnen, Thunder Client oder Postman nutzen
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "pending@test.de",
  "password": "Test123!@#",
  "firstName": "Pending",
  "lastName": "TestUser"
}

# Response sollte sein:
{
  "success": true,
  "message": "Registration successful! Your account is pending approval...",
  "data": {
    "approvalStatus": "PENDING",
    "isActive": false,
    ...
  }
}
```

### **Szenario 5: Pending User genehmigen**

```bash
1. Im Admin Panel: Klicke Tab "Wartend"
2. ✅ Siehst du "Pending TestUser"
3. Klicke "Genehmigen" Button
4. ✅ Bestätige Dialog
5. User verschwindet aus "Wartend" Tab
6. Wechsel zu "Alle Benutzer" → User ist jetzt da (Aktiv)
```

### **Szenario 6: Pending User ablehnen**

```bash
1. Erstelle weiteren Pending User (API, siehe Szenario 4)
2. Im Admin Panel: Tab "Wartend"
3. Klicke "Ablehnen" Button
4. Optional: Grund eingeben ("Email nicht verifiziert")
5. ✅ Bestätige
6. User verschwindet aus Liste
```

### **Szenario 7: Passwort ändern**

```bash
1. In "Alle Benutzer" Tab
2. Klicke 🔑 Icon bei "Test User"
3. Dialog öffnet sich
4. Neues Password: NewPass123!@
5. Bestätigen:     NewPass123!@
6. Klicke "Passwort ändern"
7. ✅ Erfolg-Meldung

# Test ob es funktioniert:
8. Logout (noch kein Button, refresh page)
9. Login mit user@example.com / NewPass123!@
10. ✅ Sollte funktionieren!
```

### **Szenario 8: User deaktivieren/aktivieren**

```bash
1. Klicke 🔒 Icon bei "Test User"
2. ✅ Status wechselt zu "✗ Inaktiv"
3. Klicke nochmal 🔓 Icon
4. ✅ Status wechselt zu "✓ Aktiv"

# Test ob Deaktivierung funktioniert:
5. Deaktiviere User
6. Versuche Login mit user@example.com / user123
7. ❌ Login sollte fehlschlagen ("Account is deactivated")
```

### **Szenario 9: Account entsperren**

```bash
# Simuliere gesperrten Account:
1. Logout als Admin
2. Versuche 10x Login mit falschem Password
3. ❌ Account wird gesperrt (30min)
4. Login als Admin
5. Gehe zu "Alle Benutzer"
6. Klicke 🔓 (Unlock) Icon bei gesperrtem User
7. ✅ Account ist entsperrt
8. User kann sich sofort wieder einloggen
```

### **Szenario 10: User löschen**

```bash
1. Erstelle Test-User (z.B. delete@test.de)
2. Klicke 🗑️ Icon
3. Bestätige Dialog
4. ✅ User wird gelöscht
5. Verschwindet aus Liste
```

### **Szenario 11: Statistiken ansehen**

```bash
1. Klicke Tab "Statistiken"
2. ✅ Siehst du Cards:
   - Gesamt Benutzer: 2-4 (je nach Tests)
   - Aktive Benutzer: 2-3
   - Wartende: 0-1
   - Abgelehnte: 0-1
   - Gesperrte: 0
   - Nach Rolle: ADMIN (1), USER (1-3)
```

---

## 🎯 **Quick Test Checklist** (5 Minuten)

Schneller Durchlauf zum Testen aller Funktionen:

- [ ] ✅ Login als Admin funktioniert
- [ ] 👥 User-Liste wird angezeigt (2 User)
- [ ] 🔍 Suche funktioniert
- [ ] ➕ Neuen User erstellen → Erscheint in Liste
- [ ] ✏️ User bearbeiten → Änderungen gespeichert
- [ ] 🔑 Passwort ändern → Neues PW funktioniert beim Login
- [ ] 🔒 User deaktivieren → Login fehlschlägt
- [ ] 🔓 User aktivieren → Login funktioniert wieder
- [ ] 📊 Statistiken zeigen korrekte Zahlen
- [ ] ⏳ Pending Tab leer (0 wartende User)
- [ ] 🗑️ User löschen → Verschwindet

**Wenn alle ✅ → Alles funktioniert perfekt!** 🎉

---

## 🐛 **Troubleshooting**

### **Problem: Backend startet nicht**

```bash
# Lösung 1: Ports prüfen
netstat -ano | findstr :3000

# Lösung 2: Backend neu starten
cd backend
npm run dev
```

### **Problem: Frontend zeigt keine User**

```bash
# Check 1: Backend läuft?
curl http://localhost:3000/health

# Check 2: Login Token vorhanden?
# F12 → Application → Local Storage → accessToken

# Check 3: Network Errors?
# F12 → Network → Fehler in rot?
```

### **Problem: "Pending" Tab zeigt keine User**

```bash
# Erstelle Pending User über API:
POST http://localhost:3000/api/auth/register
{
  "email": "test@pending.de",
  "password": "Test123!@",
  "firstName": "Test",
  "lastName": "Pending"
}

# Refresh Page → Sollte jetzt in "Wartend" erscheinen
```

### **Problem: Passwort-Änderung funktioniert nicht**

```bash
# Check 1: Password Complexity
Mindestens 8 Zeichen
Mind. 1 Großbuchstabe
Mind. 1 Kleinbuchstabe
Mind. 1 Zahl
Mind. 1 Sonderzeichen

# Beispiel GÜLTIGES Passwort:
Test123!@

# Beispiel UNGÜLTIGE Passwörter:
test123       (kein Großbuchstabe, kein Sonderzeichen)
TestTest      (keine Zahl, kein Sonderzeichen)
Test123       (kein Sonderzeichen)
```

### **Problem: Statistics zeigen 0 User**

```bash
# Database prüfen:
cd backend
npx prisma studio

# User Tabelle öffnen → Wie viele Einträge?
# Falls 0 → Seed ausführen:
npm run seed
```

---

## 📊 **Erwartete Werte nach frischem Setup**

Nach `npm run seed` solltest du haben:

```
Gesamt Benutzer:     2
Aktive Benutzer:     2
Wartende Benutzer:   0
Abgelehnte Benutzer: 0
Gesperrte Accounts:  0

Nach Rolle:
- ADMIN:   1 (admin@example.com)
- USER:    1 (user@example.com)
```

---

## 🎨 **Browser DevTools nutzen**

### **Nützliche Checks:**

```javascript
// Console (F12):

// 1. Check localStorage Token
localStorage.getItem("accessToken");
// Sollte JWT Token sein

// 2. Check User Object
JSON.parse(localStorage.getItem("user"));
// Sollte User-Daten zeigen

// 3. Check API Calls
// Network Tab → Filter: "api" → Alle Requests mit Status 200?
```

---

## 📝 **Test-Protokoll Vorlage**

Nutze diese Vorlage zum Dokumentieren deiner Tests:

```
Test Datum: __________
Tester: __________

[ ] Szenario 1: Admin Login
    Status: ☐ OK  ☐ Fehler
    Notizen: ________________________

[ ] Szenario 2: User-Liste
    Status: ☐ OK  ☐ Fehler
    Anzahl User: ____

[ ] Szenario 3: User erstellen
    Status: ☐ OK  ☐ Fehler

[ ] Szenario 4: Pending User (API)
    Status: ☐ OK  ☐ Fehler

[ ] Szenario 5: User genehmigen
    Status: ☐ OK  ☐ Fehler

[ ] Szenario 6: User ablehnen
    Status: ☐ OK  ☐ Fehler

[ ] Szenario 7: Passwort ändern
    Status: ☐ OK  ☐ Fehler

[ ] Szenario 8: User aktivieren/deaktivieren
    Status: ☐ OK  ☐ Fehler

[ ] Szenario 9: Account entsperren
    Status: ☐ OK  ☐ Fehler

[ ] Szenario 10: User löschen
    Status: ☐ OK  ☐ Fehler

[ ] Szenario 11: Statistiken
    Status: ☐ OK  ☐ Fehler

Gesamtergebnis: ___/11 OK
```

---

## 🎉 **Happy Testing!**

Viel Erfolg beim Testen deines neuen User Management Systems! 🚀

Bei Fragen oder Problemen → Einfach melden! 😊
