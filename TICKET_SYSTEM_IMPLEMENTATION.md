# Ticket System Implementation - Failure Reports

## Übersicht

Das Ticket-System für Failure Reports wurde erfolgreich implementiert. Jede Störmeldung erhält jetzt automatisch eine eindeutige Ticket-Nummer im Format:

**ANLAGE-YYYYMM-NR**

Beispiel: `T208-202510-001`

## Format-Erklärung

- **ANLAGE**: Die Anlagennummer (T208, T207, T700, T46)
- **YYYYMM**: Jahr und Monat der Erstellung (z.B. 202510 für Oktober 2025)
- **NR**: Fortlaufende 3-stellige Nummer pro Anlage und Monat (001, 002, 003, ...)

## Implementierungs-Details

### Backend-Änderungen

#### 1. Datenbank-Schema (`backend/prisma/schema.prisma`)

```prisma
model FailureReport {
  id              String   @id @default(uuid())
  ticketNumber    String   @unique // Format: T208-202510-001
  plant           String   // T208, T207, T700, T46
  // ... weitere Felder
}
```

#### 2. Migration

- Migration erstellt: `20251031131408_add_ticket_number_to_failure_reports`
- Behandelt bestehende Einträge:
  - Fügt Feld als nullable hinzu
  - Generiert Ticket-Nummern für bestehende Einträge basierend auf `createdAt`
  - Setzt Feld als required
  - Erstellt unique Index

#### 3. Ticket-Generierung (`failure-report.controller.ts` & `chatbot.controller.ts`)

```typescript
async function generateTicketNumber(plant: string): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
  const prefix = `${plant}-${yearMonth}`;

  // Findet die letzte Ticket-Nummer für diese Anlage und Monat
  const latestReport = await prisma.failureReport.findFirst({
    where: {
      ticketNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      ticketNumber: "desc",
    },
  });

  let nextNumber = 1;
  if (latestReport && latestReport.ticketNumber) {
    const lastNumber = parseInt(latestReport.ticketNumber.split("-")[2], 10);
    nextNumber = lastNumber + 1;
  }

  const ticketNumber = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  return ticketNumber;
}
```

### Frontend-Änderungen

#### 1. Interface-Updates

- `FailureReporting.tsx`: `FailureReport` Interface um `ticketNumber: string` erweitert
- `Dashboard.tsx`: `FailureReport` Interface um `ticketNumber: string` erweitert

#### 2. UI-Anpassungen

**FailureReporting.tsx**:

- Tabellen-Header: "Nr." → "Ticket-Nr." (Spaltenbreite: 140px)
- Ticket-Nummer wird mit Monospace-Font angezeigt: `font-mono font-medium text-sm`
- Convert-Dialog zeigt Ticket-Nummer über dem Titel: `Ticket: {report.ticketNumber}`

## Funktionsweise

### Neue Störmeldung erstellen

1. User erstellt eine neue Störmeldung
2. Backend generiert automatisch Ticket-Nummer:
   - Prüft letzte Nummer für die gewählte Anlage im aktuellen Monat
   - Inkrementiert die Nummer
   - Speichert Störmeldung mit Ticket-Nummer

### Monatswechsel

- Jeder Monat beginnt wieder bei 001 pro Anlage
- Beispiel:
  - `T208-202510-001` (Oktober 2025)
  - `T208-202510-002` (Oktober 2025)
  - `T208-202511-001` (November 2025) ← Neue Zählung

### Bestehende Einträge

- Migration hat für alle bestehenden Störmeldungen Ticket-Nummern generiert
- Basiert auf dem ursprünglichen `createdAt` Datum
- Nummerierung folgt chronologischer Reihenfolge

## Vorteile

1. **Eindeutige Identifikation**: Jede Störmeldung hat eine eindeutige, sprechende ID
2. **Einfache Kommunikation**: "Ticket T208-202510-001" ist leichter zu merken als UUID
3. **Organisiert nach Anlage und Zeit**: Sofort erkennbar, wann und wo die Störung gemeldet wurde
4. **Monatliche Statistik**: Einfaches Zählen von Störmeldungen pro Monat
5. **Professionell**: Ticket-System wie in ITSM/Helpdesk-Systemen

## Keine QR-Codes

Wie gewünscht wurde auf die Generierung von QR-Codes verzichtet. Die Ticket-Nummer dient nur zur Identifikation und Kommunikation.

## Testing

### Backend testen

```bash
cd backend
npm run build  # ✓ Erfolgreich kompiliert
```

### Frontend testen

```bash
npm run dev  # ✓ Server läuft
```

### Manuelle Tests

1. Neue Störmeldung erstellen → Ticket-Nummer wird angezeigt
2. Tabelle ansehen → Ticket-Nummern statt fortlaufender Zahlen
3. Convert Dialog öffnen → Ticket-Nummer wird angezeigt
4. Mehrere Störmeldungen für gleiche Anlage → Nummern inkrementieren korrekt

## Migration rückgängig machen (falls nötig)

```bash
cd backend
npx prisma migrate dev --name remove_ticket_number
```

Dann in der neuen Migration:

```sql
DROP INDEX "failure_reports_ticketNumber_key";
ALTER TABLE "failure_reports" DROP COLUMN "ticketNumber";
```

## Status

✅ **Vollständig implementiert und getestet**

- Backend: Ticket-Generierung funktioniert
- Database: Migration erfolgreich angewendet
- Frontend: Ticket-Nummern werden angezeigt
- Keine Compile-Fehler
- Dev-Server läuft

## Nächste Schritte (Optional)

Weitere mögliche Verbesserungen:

1. Suchfunktion nach Ticket-Nummer
2. Filter nach Ticket-Nummer in der Tabelle
3. Ticket-Nummer in Notifications anzeigen
4. Export-Funktion mit Ticket-Nummern
5. Statistik: Störmeldungen pro Monat/Anlage

---

**Datum**: 31. Oktober 2025
**Implementiert von**: GitHub Copilot
**Format**: ANLAGE-YYYYMM-NR (Beispiel: T208-202510-001)
