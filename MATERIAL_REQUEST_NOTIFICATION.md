# Material Request Notification System

## Überblick

Wenn eine Action im Action Tracker mit Materialbestellungen erstellt oder aktualisiert wird, erhält der RSC (Rig Supply Coordinator) der jeweiligen Anlage automatisch eine Notification.

## Funktionsweise

### 1. RSC-Benutzer

Jede Anlage hat einen RSC mit folgender Email-Struktur:

- **T208**: `T208.RSC@maintain.com`
- **T207**: `T207.RSC@maintain.com`
- **T700**: `T700.RSC@maintain.com`
- **T46**: `T46.RSC@maintain.com`

**Rolle**: Supply Coordinator  
**Standard-Passwort**: `rig123`  
**Zugeordnete Anlage**: Entsprechende Rig (z.B. T208)

### 2. Materialerkennung

Das System erkennt Materialanforderungen durch:

```
--- Materialien ---
📦 MM-Nummer | Beschreibung | Menge Einheit | Status
```

### 3. Notification-Trigger

**Bei Action-Erstellung** (`POST /api/actions`):

- Wenn `description` den Text `--- Materialien ---` enthält
- → RSC der Anlage erhält Notification

**Bei Action-Update** (`PUT /api/actions/:id`):

- Wenn Materialien neu hinzugefügt werden (vorher keine, jetzt vorhanden)
- → RSC der Anlage erhält Notification

### 4. Notification-Details

```json
{
  "userId": "RSC User ID",
  "title": "Neue Materialanforderung",
  "message": "Materialbestellung für T208: \"[Action Title]\"",
  "type": "MATERIAL_REQUEST",
  "relatedId": "Action ID",
  "isRead": false
}
```

## Backend-Implementation

### actions.ts - CREATE Action

```typescript
// Nach Action-Erstellung
if (description && description.includes("--- Materialien ---")) {
  const rscEmail = `${plant}.RSC@maintain.com`;
  const rscUser = await prisma.user.findUnique({ where: { email: rscEmail } });

  if (rscUser) {
    await prisma.notification.create({
      data: {
        userId: rscUser.id,
        title: "Neue Materialanforderung",
        message: `Materialbestellung für ${plant}: "${title}"`,
        type: "MATERIAL_REQUEST",
        relatedId: action.id,
        isRead: false,
      },
    });
  }
}
```

### actions.ts - UPDATE Action

```typescript
// Nach Action-Update - nur wenn Materialien NEU hinzugefügt wurden
if (
  description !== undefined &&
  description.includes("--- Materialien ---") &&
  !existingAction.description?.includes("--- Materialien ---")
) {
  // ... gleiche Notification-Logik
}
```

## Vorteile

✅ **Automatisch**: Keine manuelle Benachrichtigung erforderlich  
✅ **Anlagenspezifisch**: Jeder RSC bekommt nur Notifications für seine Anlage  
✅ **Fehlerbehandlung**: Notification-Fehler brechen Action-Erstellung nicht ab  
✅ **Duplizierung vermieden**: Notification nur bei neuen Materialien, nicht bei jedem Update

## Material-Status Flow

1. **Nicht bestellt** ⚪ - RSC erhält Notification
2. **Bestellt** 🟡 - RSC bestellt Material
3. **Unterwegs** 🔵 - Material ist versandt
4. **Geliefert** 🟢 - Material ist angekommen

## Testing

### 1. RSC-Login testen

```bash
Email: T208.RSC@maintain.com
Password: rig123
```

### 2. Action mit Material erstellen

1. Action Tracker öffnen
2. "Neue Action" → Tab "Materialbestellung"
3. Material hinzufügen (MM-Nummer, Beschreibung, Menge)
4. Action erstellen

### 3. Notification prüfen

1. Als T208.RSC einloggen
2. Glocke-Icon klicken
3. "Neue Materialanforderung" sollte sichtbar sein

## Beispiel

**Action erstellt von**: `philip@rigcrew.com`  
**Anlage**: T208  
**Materialien**: 3x Bohrgestänge, 2x Filter

→ **Notification an**: `T208.RSC@maintain.com`  
→ **Message**: "Materialbestellung für T208: \"Wartung Hauptpumpe\""

Der RSC kann dann:

- Notification anklicken → zur Action springen
- Material-Status aktualisieren
- Kommentare hinzufügen
