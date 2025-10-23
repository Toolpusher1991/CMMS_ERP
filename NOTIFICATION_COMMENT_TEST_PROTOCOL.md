# Test-Protokoll: Notifications & Comments System

**Datum:** 23. Oktober 2025  
**Tester:** GitHub Copilot  
**Version:** 1.0  
**Backend:** Port 5137 ✅ Running  
**Frontend:** Port 5173 (Vite Dev Server)

---

## 🎯 Test-Übersicht

Dieses Protokoll testet die vollständig implementierten Features:

1. **Notification System** - Manager-Benachrichtigungen bei Failure Reports
2. **Comment System** - Kommentare für Actions und Projekte
3. **Integration** - End-to-End Flows

---

## 📋 Test-Kategorien

### A. Notification System Tests

### B. Comment System Tests (Actions)

### C. Comment System Tests (Projects)

### D. Integration & Permission Tests

### E. UI/UX Tests

---

## A. NOTIFICATION SYSTEM TESTS

### Test A1: Manager erhält Notification bei Failure Report

**Ziel:** Verifizieren, dass alle Manager eine Benachrichtigung erhalten, wenn ein Schaden gemeldet wird.

**Voraussetzungen:**

- ✅ Backend läuft auf Port 5137
- ✅ Frontend läuft auf Port 5173
- ✅ Manager-User existiert (z.B. `manager@rigcrew.com`)
- ✅ Regular User existiert (z.B. `philip@rigcrew.com`)

**Test-Schritte:**

1. Als Regular User einloggen
2. Zu "Failure Reports" navigieren
3. Neuen Failure Report erstellen:
   - Anlage: T208
   - Titel: "Test Notification Flow"
   - Beschreibung: "Testing Manager Notification"
   - Severity: HIGH
4. Report absenden
5. Als Manager ausloggen und neu einloggen
6. NotificationBell im Header prüfen

**Erwartetes Ergebnis:**

- ✅ Badge am Bell-Icon zeigt "1" (oder mehr)
- ✅ Notification in Liste sichtbar
- ✅ Icon: ⚠️ (Failure Report)
- ✅ Titel: "Neuer Schaden gemeldet"
- ✅ Message: "[Anlage] - [Titel]"
- ✅ Zeitstempel aktuell
- ✅ Blauer Dot für ungelesen

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test A2: Notification als gelesen markieren

**Ziel:** Einzelne Notification kann als gelesen markiert werden.

**Test-Schritte:**

1. Als Manager einloggen (mit ungelesener Notification)
2. NotificationBell öffnen
3. Auf eine Notification klicken

**Erwartetes Ergebnis:**

- ✅ Notification wechselt Styling (kein blauer Dot mehr)
- ✅ Badge-Count reduziert sich um 1
- ✅ Hintergrund wird normal (nicht mehr bg-primary/5)
- ✅ API Call: PUT /api/notifications/:id/read

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test A3: Alle Notifications als gelesen markieren

**Ziel:** Bulk-Update funktioniert.

**Test-Schritte:**

1. Als Manager mit mehreren ungelesenen Notifications
2. NotificationBell öffnen
3. "Alle als gelesen markieren" Button klicken

**Erwartetes Ergebnis:**

- ✅ Alle Notifications wechseln zu "gelesen"
- ✅ Badge verschwindet (oder zeigt 0)
- ✅ Toast-Nachricht: Erfolgsbestätigung
- ✅ API Call: PUT /api/notifications/read-all

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test A4: Notification Filter (Alle / Ungelesen)

**Ziel:** Filter zwischen allen und nur ungelesenen Notifications.

**Test-Schritte:**

1. Manager mit gemischten Notifications (gelesen + ungelesen)
2. NotificationBell öffnen
3. Tab "Ungelesen (X)" klicken
4. Tab "Alle" klicken

**Erwartetes Ergebnis:**

- ✅ "Ungelesen": Nur ungelesene Notifications sichtbar
- ✅ "Alle": Alle Notifications sichtbar (gelesen + ungelesen)
- ✅ Count im Tab korrekt
- ✅ Kein API-Call beim Tab-Wechsel (Client-side Filtering)

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test A5: Notification Polling (Auto-Update)

**Ziel:** Neue Notifications erscheinen automatisch alle 30 Sekunden.

**Test-Schritte:**

1. Als Manager einloggen
2. NotificationBell öffnen, leer lassen
3. In anderem Browser/Tab: Regular User erstellt Failure Report
4. Warten 30 Sekunden (Polling-Intervall)

**Erwartetes Ergebnis:**

- ✅ Badge-Count erhöht sich automatisch
- ✅ Neue Notification erscheint in Liste (wenn Popover offen)
- ✅ Kein Page-Reload notwendig
- ✅ Console zeigt Polling-Requests alle 30s

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test A6: Notification Zeitstempel (Deutsch)

**Ziel:** formatTimeAgo() zeigt deutsche Zeitformate.

**Test-Schritte:**

1. Notifications mit verschiedenen Zeitstempeln prüfen

**Erwartetes Ergebnis:**

- ✅ < 1 Min: "Gerade eben"
- ✅ < 60 Min: "vor X Min"
- ✅ < 24 Std: "vor X Std"
- ✅ < 7 Tage: "vor X Tagen"
- ✅ > 7 Tage: DD.MM.YYYY HH:MM

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

## B. COMMENT SYSTEM TESTS (ACTIONS)

### Test B1: Kommentar zu Action hinzufügen

**Ziel:** User kann Kommentar zu einer Action erstellen.

**Test-Schritte:**

1. Zu "Action Tracker" navigieren
2. Action expandieren (Pfeil-Icon klicken)
3. Zum Kommentar-Bereich scrollen
4. Text eingeben: "Test Kommentar für Action"
5. "Kommentar senden" klicken (oder Ctrl+Enter)

**Erwartetes Ergebnis:**

- ✅ Kommentar erscheint sofort in Liste
- ✅ Avatar mit Initialen (z.B. "PA" für Philip Admin)
- ✅ Username: "Philip Admin"
- ✅ Zeitstempel: "Gerade eben"
- ✅ Badge "Kommentare (1)" aktualisiert
- ✅ Textarea wird geleert
- ✅ Toast: "Kommentar hinzugefügt"
- ✅ API Call: POST /api/comments/actions/:actionId

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test B2: Eigenen Kommentar bearbeiten

**Ziel:** User kann nur eigene Kommentare bearbeiten.

**Test-Schritte:**

1. Expandierte Action mit eigenem Kommentar
2. Edit-Icon (✏️) klicken
3. Text ändern: "Bearbeiteter Kommentar"
4. "Speichern" klicken

**Erwartetes Ergebnis:**

- ✅ Inline-Edit-Mode aktiviert (Textarea + Buttons)
- ✅ Original-Text vorausgefüllt
- ✅ "Speichern" + "Abbrechen" Buttons sichtbar
- ✅ Nach Speichern: Text aktualisiert
- ✅ "(bearbeitet)" Tag erscheint bei Zeitstempel
- ✅ Toast: "Kommentar aktualisiert"
- ✅ API Call: PUT /api/comments/actions/:actionId/comments/:commentId

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test B3: Eigenen Kommentar löschen

**Ziel:** User kann eigene Kommentare löschen.

**Test-Schritte:**

1. Eigenen Kommentar finden
2. Delete-Icon (🗑️) klicken
3. Bestätigungs-Dialog: "Löschen" klicken

**Erwartetes Ergebnis:**

- ✅ AlertDialog mit Warnung erscheint
- ✅ "Abbrechen" + "Löschen" Buttons
- ✅ Nach Bestätigung: Kommentar verschwindet
- ✅ Badge-Count dekrementiert
- ✅ Toast: "Kommentar gelöscht"
- ✅ API Call: DELETE /api/comments/actions/:actionId/comments/:commentId

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test B4: Fremde Kommentare - Keine Edit/Delete Buttons

**Ziel:** User sieht keine Edit/Delete Buttons bei fremden Kommentaren.

**Test-Schritte:**

1. Action mit Kommentar von anderem User expandieren
2. Fremden Kommentar prüfen

**Erwartetes Ergebnis:**

- ✅ Kommentar sichtbar (Text, Username, Zeitstempel)
- ✅ KEINE Edit/Delete Buttons (nur bei eigenen)
- ✅ Avatar mit Initialen des anderen Users

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test B5: Kommentare beim Row-Expand laden

**Ziel:** Kommentare werden automatisch geladen beim Expandieren.

**Test-Schritte:**

1. Action Tracker öffnen
2. Action expandieren (erste Expansion)
3. Network-Tab in DevTools prüfen

**Erwartetes Ergebnis:**

- ✅ API Call: GET /api/comments/actions/:actionId
- ✅ Kommentare erscheinen (wenn vorhanden)
- ✅ Oder: "Noch keine Kommentare" Message
- ✅ Zweites Expand: Kein erneuter API-Call (gecached)

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test B6: Scroll-Verhalten bei vielen Kommentaren

**Ziel:** ScrollArea funktioniert bei vielen Kommentaren.

**Test-Schritte:**

1. Action mit 10+ Kommentaren
2. Kommentar-Bereich prüfen

**Erwartetes Ergebnis:**

- ✅ Scroll-Container mit max-height 300px
- ✅ Scrollbar erscheint bei Overflow
- ✅ Neuer Kommentar: Auto-scroll to bottom
- ✅ Smooth scrolling

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

## C. COMMENT SYSTEM TESTS (PROJECTS)

### Test C1: Kommentar zu Project hinzufügen

**Ziel:** User kann Kommentar zu einem Projekt erstellen.

**Test-Schritte:**

1. Zu "Projekt Management" navigieren
2. Projekt expandieren (Pfeil-Icon klicken)
3. Zum Kommentar-Bereich scrollen (nach Dateien)
4. Text eingeben: "Test Kommentar für Projekt"
5. "Kommentar senden" klicken

**Erwartetes Ergebnis:**

- ✅ Kommentar erscheint sofort in Liste
- ✅ Avatar mit Initialen
- ✅ Username sichtbar
- ✅ Zeitstempel: "Gerade eben"
- ✅ Toast: "Kommentar hinzugefügt"
- ✅ API Call: POST /api/comments/projects/:projectId

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test C2: Project Kommentar bearbeiten & löschen

**Ziel:** CRUD Operationen für Project Comments.

**Test-Schritte:**

1. Eigenen Project-Kommentar bearbeiten
2. Eigenen Project-Kommentar löschen

**Erwartetes Ergebnis:**

- ✅ Gleiche Funktionalität wie Action Comments
- ✅ Edit: Inline-Mode mit Textarea
- ✅ Delete: AlertDialog Bestätigung
- ✅ API Calls: PUT/DELETE /api/comments/projects/:projectId/comments/:commentId

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test C3: Project Comments beim Expand laden

**Ziel:** Kommentare werden beim Projekt-Expand geladen.

**Test-Schritte:**

1. Projekt expandieren
2. Network-Tab prüfen

**Erwartetes Ergebnis:**

- ✅ API Call: GET /api/comments/projects/:projectId
- ✅ Kommentare erscheinen
- ✅ Caching beim zweiten Expand

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

## D. INTEGRATION & PERMISSION TESTS

### Test D1: Backend Permission - Nur Author kann editieren

**Ziel:** Backend verhindert Edit von fremden Comments.

**Test-Schritte:**

1. Als User A: Kommentar erstellen (CommentID notieren)
2. Als User B einloggen
3. API Call manuell: PUT /api/comments/actions/:actionId/comments/:commentId
   - Headers: User B Token
   - Body: {"text": "Versuch zu ändern"}

**Erwartetes Ergebnis:**

- ✅ Response: 403 Forbidden
- ✅ Error: "You can only edit your own comments"
- ✅ Kommentar bleibt unverändert

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test D2: Backend Permission - Admin/Manager können löschen

**Ziel:** Admin und Manager können alle Comments löschen.

**Test-Schritte:**

1. Als Regular User: Kommentar erstellen
2. Als Admin/Manager einloggen
3. Fremden Kommentar löschen

**Erwartetes Ergebnis:**

- ✅ DELETE erfolgreich (200 OK)
- ✅ Kommentar wird gelöscht
- ✅ Toast: "Kommentar gelöscht"

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test D3: Notification + Comment Integration

**Ziel:** Notification für Failure Report + Comment auf Action.

**Test-Schritte:**

1. Als User: Failure Report erstellen → Action wird erstellt
2. Manager erhält Notification
3. Manager klickt Notification → navigiert zu Action?
4. Manager expandiert Action
5. Manager schreibt Kommentar
6. User sieht Kommentar

**Erwartetes Ergebnis:**

- ✅ Notification erscheint
- ✅ Action-Link funktioniert (optional)
- ✅ Kommentar-System funktioniert unabhängig
- ✅ Alle User sehen neue Kommentare

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test D4: Multiuser-Szenario

**Ziel:** Mehrere User kommentieren gleichzeitig.

**Test-Schritte:**

1. User A: Kommentar hinzufügen
2. User B: Kommentar hinzufügen (gleiche Action)
3. User A: Seite refreshen

**Erwartetes Ergebnis:**

- ✅ Beide Kommentare sichtbar
- ✅ Chronologische Reihenfolge
- ✅ Korrekte User-Zuordnung (Avatar, Name)

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

## E. UI/UX TESTS

### Test E1: Responsive Design - Mobile View

**Ziel:** Alle Features funktionieren auf mobilen Geräten.

**Test-Schritte:**

1. Browser auf 375px Breite setzen (iPhone SE)
2. NotificationBell testen
3. CommentSection testen

**Erwartetes Ergebnis:**

- ✅ Bell-Icon sichtbar und klickbar
- ✅ Popover öffnet sich korrekt
- ✅ Notifications lesbar (kein Overflow)
- ✅ CommentSection: Textarea responsive
- ✅ Buttons nicht abgeschnitten

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test E2: Toast-Benachrichtigungen

**Ziel:** Alle Actions zeigen korrekte Toast Messages.

**Test-Schritte:**

1. Verschiedene Actions durchführen (Kommentar add/edit/delete, Notification mark-read)
2. Toast Messages prüfen

**Erwartetes Ergebnis:**

- ✅ Erfolg: Grüner Toast
- ✅ Fehler: Roter Toast (variant="destructive")
- ✅ Deutscher Text
- ✅ Auto-dismiss nach 3-5 Sekunden

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test E3: Tastatur-Shortcuts

**Ziel:** Ctrl+Enter sendet Kommentar.

**Test-Schritte:**

1. Kommentar-Textarea fokussieren
2. Text eingeben
3. Strg+Enter drücken

**Erwartetes Ergebnis:**

- ✅ Kommentar wird gesendet
- ✅ Gleicher Flow wie Button-Click

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test E4: Empty States

**Ziel:** Leere Zustände sind benutzerfreundlich.

**Test-Schritte:**

1. Action ohne Kommentare expandieren
2. Manager ohne Notifications prüfen

**Erwartetes Ergebnis:**

- ✅ "Noch keine Kommentare" mit Icon
- ✅ "Keine Benachrichtigungen" Message
- ✅ Nicht nur leerer Bereich

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

### Test E5: Loading States

**Ziel:** Loading-Indikatoren bei API-Calls.

**Test-Schritte:**

1. Kommentar senden (langsames Netzwerk simulieren)
2. Comments laden beim Expand

**Erwartetes Ergebnis:**

- ✅ Disabled Buttons während Submit
- ✅ Loading-Spinner oder Skeleton (optional)
- ✅ Keine Doppel-Submits möglich

**Tatsächliches Ergebnis:**

- [ ] Pass / [ ] Fail
- **Notizen:** **********\_**********

---

## 📊 TEST-ZUSAMMENFASSUNG

### Kategorien-Übersicht

- **A. Notification System:** \_\_\_ / 6 Tests bestanden
- **B. Comment System (Actions):** \_\_\_ / 6 Tests bestanden
- **C. Comment System (Projects):** \_\_\_ / 3 Tests bestanden
- **D. Integration & Permissions:** \_\_\_ / 4 Tests bestanden
- **E. UI/UX Tests:** \_\_\_ / 5 Tests bestanden

### Gesamt

**Total:** \_\_\_ / 24 Tests bestanden

**Pass Rate:** \_\_\_\_%

---

## 🐛 GEFUNDENE BUGS

### Bug #1

**Titel:** **********\_**********  
**Schwere:** [ ] Critical [ ] High [ ] Medium [ ] Low  
**Beschreibung:** **********\_**********  
**Reproduktion:** **********\_**********  
**Erwartetes Verhalten:** **********\_**********  
**Tatsächliches Verhalten:** **********\_**********

---

## ✅ ABNAHME-KRITERIEN

### Muss erfüllt sein (Critical):

- [ ] Manager erhalten Notifications bei Failure Reports
- [ ] Notifications können als gelesen markiert werden
- [ ] Kommentare können erstellt, bearbeitet und gelöscht werden
- [ ] Permissions korrekt (nur eigene Comments editierbar)
- [ ] Keine kritischen Bugs

### Sollte erfüllt sein (High):

- [ ] Polling funktioniert (30s Auto-Update)
- [ ] Toast-Benachrichtigungen erscheinen
- [ ] Responsive Design funktioniert
- [ ] Deutsche Zeitformate korrekt

### Kann erfüllt sein (Nice-to-have):

- [ ] Tastatur-Shortcuts (Ctrl+Enter)
- [ ] Smooth Scrolling bei Comments
- [ ] Loading States sichtbar

---

## 📝 NOTIZEN & EMPFEHLUNGEN

**Performance:**

- ***

**Usability:**

- ***

**Verbesserungsvorschläge:**

- ***

**Nächste Schritte:**

- ***

---

## ✍️ UNTERSCHRIFT

**Getestet von:** **********\_**********  
**Datum:** **********\_**********  
**Status:** [ ] Freigegeben [ ] Zurückgestellt [ ] Abgelehnt
