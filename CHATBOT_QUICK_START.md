# 🤖 MaintAIn Chatbot - Quick Start

## ⚡ In 3 Minuten starten:

### 1️⃣ OpenAI API Key holen (2 Min)

```
1. Gehe zu: https://platform.openai.com/api-keys
2. Klicke "Create new secret key"
3. Name: "CMMS_Chatbot"
4. Kopiere den Key (beginnt mit sk-proj-...)
```

### 2️⃣ Key eintragen (30 Sek)

```bash
# Öffne: backend/.env
OPENAI_API_KEY=sk-proj-DEIN_KEY_HIER
```

### 3️⃣ Server neu starten (30 Sek)

```bash
cd backend
npm run dev
```

**Fertig! 🎉** Chat-Button erscheint unten rechts im Frontend.

---

## 💡 Test-Fragen

```
✅ Zeige mir meine offenen Actions
✅ Erstelle eine Action für Pumpe P-101 in T208
✅ Wie viele Benachrichtigungen habe ich?
✅ Ich möchte einen Schaden melden
```

---

## 💰 Kosten

- **~0,02€ pro Monat** bei 100 Nachrichten
- Setze Limit: https://platform.openai.com/settings/organization/limits
- Empfohlen: $5/Monat Maximum

---

## 🔧 Probleme?

### "OpenAI API key not configured"

→ Backend neu starten: `npm run dev`

### "401 Unauthorized"

→ Neuen Key erstellen, kein Leerzeichen in .env!

### "Insufficient quota"

→ Zahlungsmethode hinzufügen: https://platform.openai.com/settings/organization/billing

---

**Vollständige Anleitung:** [CHATBOT_SETUP_GUIDE.md](./CHATBOT_SETUP_GUIDE.md)
