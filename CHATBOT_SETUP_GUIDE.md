# 🤖 MaintAIn Chatbot - Setup Guide

## Was ist der Chatbot?

Der **MaintAIn Assistant** ist ein KI-gestützter Chatbot, der auf **OpenAI GPT-4o-mini** basiert und dir bei folgenden Aufgaben hilft:

- ✅ **Actions erstellen** und verwalten
- ✅ **Schadensberichte** erstellen
- ✅ **Materialien** anzeigen und bestellen
- ✅ **Benachrichtigungen** anzeigen
- ✅ **Informationen abrufen** über offene Actions, Projekte, etc.

---

## 🔑 **Schritt 1: OpenAI API Key erstellen**

### 1.1 OpenAI Account erstellen

1. Gehe zu: **https://platform.openai.com/**
2. Klicke auf **"Sign up"** (oder **"Log in"** wenn du schon einen Account hast)
3. Bestätige deine Email-Adresse

### 1.2 Zahlungsmethode hinzufügen

⚠️ **Wichtig:** Du musst eine Kreditkarte hinterlegen, auch wenn die Kosten minimal sind!

1. Gehe zu: **https://platform.openai.com/settings/organization/billing/overview**
2. Klicke auf **"Add payment method"**
3. Füge deine Kreditkarte hinzu
4. **Optional:** Setze ein monatliches Limit (z.B. 5€) unter "Usage limits"

### 1.3 API Key generieren

1. Gehe zu: **https://platform.openai.com/api-keys**
2. Klicke auf **"+ Create new secret key"**
3. **Name:** `CMMS_Chatbot` (oder beliebig)
4. **Permissions:** Default (All)
5. Klicke **"Create secret key"**
6. ⚠️ **WICHTIG:** Kopiere den Key SOFORT (wird nur einmal angezeigt!)
   - Format: `sk-proj-...` (beginnt mit `sk-proj-` oder `sk-`)

---

## 🛠️ **Schritt 2: API Key im Backend eintragen**

### 2.1 `.env` Datei bearbeiten

1. Öffne: `backend/.env`
2. Suche die Zeile mit `OPENAI_API_KEY`
3. Ersetze `sk-your-openai-api-key-here` mit deinem Key:

```env
# OpenAI API (für Chatbot)
OPENAI_API_KEY=sk-proj-ABC123xyz...
```

4. **Speichern** (Ctrl+S)

### 2.2 Backend neu starten

```bash
cd backend
npm run dev
```

Du solltest sehen:

```
🚀 Server is running on http://localhost:5137
```

---

## 💰 **Kosten & Nutzung**

### Preis: GPT-4o-mini

- **Input:** $0.15 pro 1 Million Tokens (~750.000 Wörter)
- **Output:** $0.60 pro 1 Million Tokens

### Beispiel-Rechnung

**Typische Chat-Nachricht:**

- Frage: "Zeige mir meine offenen Actions" = ~50 Tokens
- Antwort: ~200 Tokens
- **Gesamt:** ~250 Tokens

**Monatliche Nutzung (100 Nachrichten/Monat):**

- 100 Nachrichten × 250 Tokens = 25.000 Tokens
- Input-Kosten: (25.000 / 1.000.000) × $0.15 = **$0.00375**
- Output-Kosten: (25.000 / 1.000.000) × $0.60 = **$0.015**
- **Total: ~0,02€ pro Monat** (bei 100 Nachrichten)

### Schutzmechanismen

Um unerwartete Kosten zu vermeiden:

1. **Usage Limit setzen:**

   - Gehe zu: https://platform.openai.com/settings/organization/limits
   - Setze **"Monthly budget"** auf z.B. **$5**
   - Bei Erreichen wird API automatisch deaktiviert

2. **Email-Benachrichtigungen:**

   - Automatische Warnung bei 80% und 100% des Limits

3. **Monitoring:**
   - Prüfe Nutzung: https://platform.openai.com/usage
   - Zeigt Kosten pro Tag/Monat

---

## 🧪 **Schritt 3: Chatbot testen**

### 3.1 Frontend starten

```bash
# Im Hauptverzeichnis
npm run dev
```

Öffne: **http://localhost:5174**

### 3.2 Chatbot öffnen

1. Logge dich ein (z.B. als `philip@rigcrew.com`)
2. **Unten rechts** siehst du einen blauen **Chat-Button** 💬
3. Klicke darauf → Chat-Fenster öffnet sich

### 3.3 Test-Fragen

Probiere diese Fragen aus:

```
✅ "Zeige mir meine offenen Actions"
✅ "Erstelle eine Action für Pumpe P-101 in T208"
✅ "Wie viele Benachrichtigungen habe ich?"
✅ "Ich möchte einen Schaden melden"
✅ "Zeige mir Materialien mit Status BESTELLT"
```

**Erwartetes Ergebnis:**

- Bot antwortet auf Deutsch 🇩🇪
- Bei "Erstelle Action": Fragt nach fehlenden Details (Priorität, Zuständiger, etc.)
- Bei "Zeige Actions": Listet deine Actions auf

---

## 🔧 **Troubleshooting**

### Problem: "OpenAI API key not configured"

**Lösung:**

1. Prüfe ob `.env` Datei korrekt ist
2. Backend neu starten: `npm run dev`
3. Prüfe Browser-Console (F12) auf Fehler

### Problem: "401 Unauthorized" / "Invalid API key"

**Lösung:**

1. API Key erneut erstellen: https://platform.openai.com/api-keys
2. Prüfe ob Key mit `sk-proj-` oder `sk-` beginnt
3. Keine Leerzeichen vor/nach dem Key in `.env`!

### Problem: "Rate limit exceeded"

**Lösung:**

- Zu viele Anfragen in kurzer Zeit
- Warte 60 Sekunden und versuche erneut
- Prüfe: https://platform.openai.com/usage

### Problem: "Insufficient quota"

**Lösung:**

1. Zahlungsmethode hinzufügen (siehe Schritt 1.2)
2. Oder: Guthaben aufladen unter "Billing"

---

## 🔒 **Sicherheit**

### ⚠️ **WICHTIG: API Key schützen!**

1. **NIEMALS** den API Key in Git committen!
2. `.env` Datei ist in `.gitignore` (bereits vorhanden)
3. Teile deinen Key mit **niemandem**
4. Bei Leak: Key sofort löschen unter https://platform.openai.com/api-keys

### Best Practices

- ✅ Verwende `.env` für sensitive Daten
- ✅ Setze monatliches Limit ($5-10)
- ✅ Prüfe regelmäßig Nutzung
- ✅ Rotiere Keys alle 3-6 Monate

---

## 📊 **Features des Chatbots**

### Was der Bot kann:

#### 1. **Actions verwalten**

```
User: "Zeige mir alle Actions in T208"
Bot: "Hier sind deine Actions in T208: ..."

User: "Erstelle eine Action für Motor M-42"
Bot: "Gerne! Für welche Anlage? (T208, T207, T700, T46)"
```

#### 2. **Schadensberichte erstellen**

```
User: "Ich möchte einen Schaden melden"
Bot: "Für welche Anlage möchtest du den Schaden melden?"

User: "T208, Pumpe leckt"
Bot: "Wie schwer ist der Schaden? (LOW, MEDIUM, HIGH, CRITICAL)"
```

#### 3. **Informationen abrufen**

```
User: "Wie viele offene Actions habe ich?"
Bot: "Du hast aktuell 3 offene Actions: ..."

User: "Zeige mir meine Benachrichtigungen"
Bot: "Du hast 2 ungelesene Benachrichtigungen: ..."
```

#### 4. **Materialien**

```
User: "Welche Materialien sind unterwegs?"
Bot: "Hier sind die Materialien mit Status UNTERWEGS: ..."
```

### Was der Bot NICHT kann (noch):

- ❌ Dateien hochladen (kommt später)
- ❌ Bilder analysieren
- ❌ Komplexe Berechnungen
- ❌ Daten exportieren

---

## 🎨 **Anpassungen**

### System Prompt ändern

Der Bot's "Persönlichkeit" ist in `backend/src/controllers/chatbot.controller.ts` definiert:

```typescript
const SYSTEM_PROMPT = `Du bist ein hilfreicher Assistent...`;
```

Du kannst hier ändern:

- Sprache/Ton (förmlich vs. locker)
- Verfügbare Features
- Beispiel-Antworten

### Neue Funktionen hinzufügen

Füge neue Tools in `TOOLS` Array hinzu:

```typescript
{
  type: 'function',
  function: {
    name: 'get_projects',
    description: 'Ruft Projekte ab',
    parameters: { ... }
  }
}
```

Dann implementiere in `executeFunction()`.

---

## 📞 **Support**

### Nützliche Links

- **OpenAI Platform:** https://platform.openai.com/
- **API Dokumentation:** https://platform.openai.com/docs/
- **Usage Dashboard:** https://platform.openai.com/usage
- **API Keys:** https://platform.openai.com/api-keys
- **Billing:** https://platform.openai.com/settings/organization/billing

### Community

- **OpenAI Discord:** https://discord.gg/openai
- **Forum:** https://community.openai.com/

---

## ✅ **Checkliste**

Nach Setup solltest du folgendes haben:

- [ ] OpenAI Account erstellt
- [ ] Zahlungsmethode hinterlegt
- [ ] API Key generiert
- [ ] Key in `backend/.env` eingetragen
- [ ] Backend neu gestartet (`npm run dev`)
- [ ] Frontend läuft (`npm run dev`)
- [ ] Chat-Button unten rechts sichtbar
- [ ] Test-Frage erfolgreich beantwortet
- [ ] Monatliches Limit gesetzt ($5-10)

---

**Viel Erfolg mit deinem KI-Assistenten! 🚀**

Bei Fragen oder Problemen, siehe **Troubleshooting** oben.
