# 📧 SendGrid E-Mail Integration

## Setup-Anleitung

### 1. SendGrid Account erstellen

1. Gehe zu: https://signup.sendgrid.com/
2. Registriere dich kostenlos (12.000 E-Mails/Monat)
3. Verifiziere deine E-Mail-Adresse

### 2. Sender Identity einrichten

**Option A: Single Sender Verification (Einfach)**
1. Gehe zu: Settings → Sender Authentication
2. Wähle "Single Sender Verification"
3. Trage deine E-Mail ein (z.B. `nils@yourdomain.com`)
4. Bestätige die Verifizierungs-E-Mail

**Option B: Domain Authentication (Professionell)**
1. Gehe zu: Settings → Sender Authentication
2. Wähle "Authenticate Your Domain"
3. Füge die DNS-Records zu deiner Domain hinzu
4. Warte auf Verifizierung (~48h)

### 3. API Key erstellen

1. Gehe zu: Settings → API Keys → Create API Key
2. Name: `CMMS-Production`
3. Permission: **Full Access** (oder nur "Mail Send")
4. **Kopiere den Key SOFORT** (wird nur einmal angezeigt!)

### 4. Environment Variables setzen

**Lokal (Backend/.env):**
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

**Production (Render.com):**
1. Gehe zu: Render Dashboard → Backend Service → Environment
2. Füge hinzu:
   - `SENDGRID_API_KEY`: (dein API Key)
   - `SENDGRID_FROM_EMAIL`: (deine verifizierte E-Mail)
   - `FRONTEND_URL`: `https://maintain-nory.onrender.com`

### 5. Verwendung im Code

**Action zuweisen mit E-Mail:**
```typescript
import { sendActionAssignedEmail } from '../services/email.service';

// In deiner Action-Route:
await sendActionAssignedEmail(action.assignedTo, {
  title: action.title,
  plant: action.plant,
  priority: action.priority,
  dueDate: action.dueDate,
  assignedBy: req.user.email,
});
```

**Kommentar-Benachrichtigung:**
```typescript
import { sendCommentNotificationEmail } from '../services/email.service';

await sendCommentNotificationEmail(recipientEmail, {
  commentText: comment.text,
  itemTitle: action.title,
  itemType: 'action',
  commentedBy: req.user.name,
});
```

**Deadline-Erinnerung:**
```typescript
import { sendDeadlineReminderEmail } from '../services/email.service';

await sendDeadlineReminderEmail(action.assignedTo, {
  title: action.title,
  dueDate: action.dueDate,
  itemType: 'action',
});
```

## Verfügbare E-Mail-Templates

- ✅ **Action zugewiesen** - `sendActionAssignedEmail()`
- ✅ **Kommentar-Benachrichtigung** - `sendCommentNotificationEmail()`
- ✅ **Deadline-Erinnerung** - `sendDeadlineReminderEmail()`

## Troubleshooting

### E-Mails kommen nicht an?

1. **Prüfe API Key:**
   ```bash
   curl --request POST \
     --url https://api.sendgrid.com/v3/mail/send \
     --header "Authorization: Bearer $SENDGRID_API_KEY" \
     --header 'Content-Type: application/json' \
     --data '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"noreply@yourdomain.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
   ```

2. **Prüfe Sender-Verifizierung:**
   - Settings → Sender Authentication
   - Status muss "Verified" sein

3. **Prüfe Spam-Ordner**

4. **Prüfe SendGrid Activity:**
   - SendGrid Dashboard → Email Activity
   - Siehst du die gesendeten E-Mails?

### Logs prüfen:

```bash
# Backend-Logs (Render)
render logs --service cmms-erp-backend

# Lokal
npm run dev
# Achte auf: ✅ Email sent to ...
```

## Kosten & Limits

**Free Plan:**
- 12.000 E-Mails/Monat
- 100 E-Mails/Tag
- Alle Features

**Essentials Plan ($19.95/Monat):**
- 50.000 E-Mails/Monat
- 1.500 E-Mails/Tag
- E-Mail-Validierung

## Best Practices

1. **Rate Limiting:** Max. 100 E-Mails/Tag (Free Plan)
2. **Batching:** Fasse mehrere Benachrichtigungen zusammen
3. **Unsubscribe:** Füge Abmelde-Link hinzu (bei Marketing-E-Mails)
4. **Testing:** Teste mit echten E-Mail-Adressen (nicht +xyz Aliase)

## Links

- [SendGrid Dashboard](https://app.sendgrid.com/)
- [API Dokumentation](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [Node.js Package](https://github.com/sendgrid/sendgrid-nodejs)
