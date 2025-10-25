# 📱 Kamera-Zugriff für lokales Testing aktivieren

## Problem

Mobile Browser blockieren Kamera-Zugriff über HTTP aus Sicherheitsgründen.
Nur HTTPS-Verbindungen dürfen auf die Kamera zugreifen.

## Lösung 1: Chrome Flag (Temporär für Testing)

### Auf Android/iPhone Chrome:

1. **Öffne Chrome** auf deinem Handy
2. **Gib ein:** `chrome://flags`
3. **Suche:** "Insecure origins treated as secure"
4. **Füge hinzu:** `http://192.168.188.20:5173`
5. **Klicke:** "Relaunch" (Chrome neu starten)
6. **Teste:** QR-Scanner sollte jetzt funktionieren

### Screenshot:

```
chrome://flags

Search flags: insecure

[Insecure origins treated as secure]
Add: http://192.168.188.20:5173

[Relaunch]
```

## Lösung 2: Render.com Deployment (Production)

### Deploy auf Render.com:

- Render.com hat automatisch HTTPS
- Keine Konfiguration nötig
- Funktioniert sofort auf allen Geräten

### URLs nach Deployment:

- Frontend: `https://maintain-nory.onrender.com` ✅ HTTPS
- Backend: `https://cmms-erp-backend.onrender.com` ✅ HTTPS
- QR-Scanner funktioniert ohne Flags

## Lösung 3: Lokales HTTPS (Fortgeschritten)

### Mit mkcert (selbst-signiertes Zertifikat):

```bash
# 1. mkcert installieren
npm install -g mkcert

# 2. Zertifikat erstellen
cd CMMS_ERP
mkcert create-ca
mkcert create-cert

# 3. Vite mit HTTPS starten
# In vite.config.ts:
server: {
  https: {
    key: fs.readFileSync('./cert.key'),
    cert: fs.readFileSync('./cert.crt'),
  }
}
```

## ⚡ Empfehlung für Montag-Präsentation:

**Option A: Chrome Flag**

- ✅ Schnell (2 Minuten)
- ✅ Keine Code-Änderung
- ❌ Nur für dein Handy
- ❌ Muss nach Chrome-Update wiederholt werden

**Option B: Render Deployment**

- ✅ Funktioniert für alle
- ✅ Production-ready
- ✅ Automatisches HTTPS
- ⏱️ 10 Minuten Setup

## 🎯 Für sofortiges Testing:

**Jetzt gleich:**

1. Chrome auf Handy öffnen
2. `chrome://flags` eingeben
3. "Insecure origins" suchen
4. `http://192.168.188.20:5173` hinzufügen
5. Chrome neu starten
6. QR-Scanner testen

**Für Montag:**

- Git push machen
- Render.com deployed automatisch
- HTTPS läuft → Kamera funktioniert überall

## Alternative: Desktop-Browser Testing

Manche Desktop-Browser (Chrome/Edge) erlauben localhost über HTTP:

- `http://localhost:5173` → Kamera erlaubt ✅
- `http://192.168.x.x:5173` → Kamera blockiert ❌

**Desktop-Test:**

1. Öffne `http://localhost:5173` (nicht IP!)
2. QR-Code auf zweitem Monitor/Handy-Bildschirm anzeigen
3. Mit Laptop-Webcam scannen

---

**Zusammenfassung:**

- 🔒 HTTP + Kamera = Blockiert (Sicherheit)
- 🔓 HTTPS + Kamera = Erlaubt
- 🛠️ Chrome Flag = Temporärer Workaround
- 🚀 Render.com = Dauerhafte Lösung
