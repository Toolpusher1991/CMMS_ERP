# SAP Excel Import - Anleitung

## ✅ Implementiert!

Die Work Order Management Seite unterstützt jetzt den vollständigen Excel-Import mit **Main WorkCenter Filter**.

---

## 📋 Excel-Format

Die Import-Funktion erwartet folgendes SAP Excel-Format:

### Spalten-Mapping:

| Excel-Spalte | Feldname       | Beschreibung                                                     |
| ------------ | -------------- | ---------------------------------------------------------------- |
| **A**        | Order Type     | PM02, PM06, SUP, RM-INSP, TP-INSP, MECH, ELEC, TOP, etc.         |
| **B**        | Main WorkCtr   | **HAUPT-FILTER!** (SUP, RM-INSP, TP-INSP, MECH, ELEC, TOP, etc.) |
| **C**        | Order          | Order-Nummer (z.B. 200848281)                                    |
| **D**        | Description    | Beschreibung des Work Orders                                     |
| **E**        | -              | (Ignoriert)                                                      |
| **F**        | -              | (Ignoriert)                                                      |
| **G**        | Actual release | Release-Datum (optional)                                         |
| **H**        | Bas.           | Basic Start Date (optional)                                      |

---

## 🎯 Funktionen

### 1. **Excel Upload**

- Drag & Drop oder Click to Upload
- Unterstützte Formate: `.xlsx`, `.xls`
- Automatische Datenverarbeitung

### 2. **Main WorkCenter Filter**

- **Automatische Erkennung** aller verfügbaren Work Centers
- **Button-basierte Filter** für einfache Auswahl
- Anzeige der Anzahl pro Work Center

### 3. **Prioritäten-System**

Automatische Prioritäts-Zuweisung basierend auf:

- Keywords: `urgent`, `emergency`, `critical` → **URGENT**
- Keywords: `high`, `important` → **HIGH**
- PM06 Orders → **LOW**
- Alle anderen → **MEDIUM**

### 4. **Kategorisierung**

Automatische Kategorie-Zuweisung:

- `*-INSP` → INSPECTION
- `SUP` → SUPPLY
- `TOP` → TOPSIDE
- `MECH` → MECHANICAL
- `ELEC` → ELECTRICAL
- Andere → MAINTENANCE

### 5. **Statistiken**

- Total Work Orders
- Gefilterte Work Orders
- Anzahl Work Centers
- Urgent Priority Count

---

## 🚀 Verwendung

### Schritt 1: Excel-Datei vorbereiten

1. SAP Work Order Export öffnen
2. Sicherstellen, dass Header in Zeile 1 ist
3. Spalten A-D müssen ausgefüllt sein (Spalte E-F optional)

### Schritt 2: Upload

1. In die **Work Orders** Seite navigieren
2. Auf Upload-Bereich klicken
3. Excel-Datei auswählen
4. ✅ Erfolgsmeldung abwarten

### Schritt 3: Filtern

1. **Main WorkCenter Filter** wird automatisch angezeigt
2. Auf gewünschten Work Center Button klicken (z.B. "MECH (15)")
3. Tabelle zeigt nur gefilterte Work Orders

### Schritt 4: Filter zurücksetzen

- Button "Filter zurücksetzen" (X) klicken
- Oder "Alle" Button klicken

---

## 📊 Beispiel-Daten

### Excel-Zeilen (wie im Screenshot):

```
Row 2: PM02 | SUP | 200848281 | Shear Rams for BOPs, MSP
Row 3: PM06 | RM-INSP | 500047777 | Camp replacement estimate, INSP
Row 4: PM02 | TP-INSP | 201618006 | Cert. Registr.- Lifting Points Inspectio
Row 13: PM02 | MECH | 201736462 | Mud Gas Separator, MECH | 07.10.2025
Row 14: PM02 | MECH | 201793227 | Top Drive 350/500/750 Bentec <=3M, MECH | 07.10.2025
```

### Nach Import verfügbare Filter:

- **Alle** (alle Work Orders)
- **SUP** (Supply Orders)
- **RM-INSP** (RM Inspections)
- **TP-INSP** (TP Inspections)
- **MECH** (Mechanical Work)
- **ELEC** (Electrical Work)
- **TOP** (Topside Work)

---

## 🔍 Features im Detail

### Tabellen-Ansicht:

- ✅ Order Type Badge
- ✅ Main WorkCtr Badge (blau hervorgehoben)
- ✅ Order Number (Monospace Font)
- ✅ Description (truncated mit Tooltip)
- ✅ Priority Badge (farbcodiert)
- ✅ Category Badge
- ✅ Actual Release Datum
- ✅ Start Datum

### Filter-Buttons:

- Zeigen Anzahl pro Work Center
- Aktiver Filter = Blau hervorgehoben
- "Alle" zeigt Gesamtanzahl
- "X Filter zurücksetzen" Button erscheint bei aktivem Filter

### Statistik-Karten:

1. **Total Work Orders** - Gesamtanzahl importiert
2. **Gefiltert** - Anzahl nach aktuellem Filter (blau)
3. **Work Centers** - Anzahl verschiedener Work Centers (lila)
4. **Urgent Priority** - Anzahl urgenter Work Orders (rot)

---

## 🎨 UI/UX Features

### Farb-Codierung:

**Priority:**

- 🔴 URGENT - Rot
- 🟠 HIGH - Orange
- 🟡 MEDIUM - Gelb
- 🟢 LOW - Grün

**Status:**

- 🔵 Main WorkCtr Badge - Immer blau hervorgehoben
- ⚪ Order Type - Outline Badge
- ⚪ Category - Secondary Badge

### Responsive Design:

- Tabelle scrollbar auf kleinen Bildschirmen
- Statistik-Karten Grid (4 Spalten auf Desktop, 1 auf Mobile)
- Filter-Buttons wrap auf kleinen Bildschirmen

### Dark Mode:

- ✅ Vollständig unterstützt
- Automatische Farbanpassungen
- Lesbare Tabellen im Dark Mode

---

## 🐛 Fehlerbehandlung

### Import-Fehler:

- ❌ "Keine Daten gefunden" - Excel enthält keine gültigen Daten
- ❌ "Excel-Fehler" - Datei konnte nicht gelesen werden
- ❌ "Datei-Fehler" - Upload fehlgeschlagen
- ❌ "Upload-Fehler" - Allgemeiner Fehler

### Filter-Fehler:

- "Keine Work Orders gefunden" - Kein Work Order entspricht Filter
- Button "Filter zurücksetzen" verfügbar

---

## 📝 Technische Details

### Verwendete Bibliotheken:

- `xlsx` - Excel-Datei Parsing
- `shadcn/ui` - UI Components
- `lucide-react` - Icons
- React Hooks - State Management

### Datei-Struktur:

```
src/pages/WorkOrderManagementNew.tsx  (Neue Komponente)
src/pages/WorkOrderManagement.tsx     (Alte Version - Backup)
src/App.tsx                           (Updated Import)
```

### TypeScript Interface:

```typescript
interface WorkOrder {
  id: string;
  orderType: string; // Spalte A
  mainWorkCtr: string; // Spalte B - FILTER
  order: string; // Spalte C
  description: string; // Spalte D
  actualRelease: string | null; // Spalte G
  basicStartDate: string | null; // Spalte H
  category: string; // Auto-generiert
  priority: string; // Auto-generiert
  status: string; // Auto-generiert
}
```

---

## ✨ Nächste Schritte (Optional)

Mögliche Erweiterungen:

1. **Export-Funktion** - Gefilterte Daten zurück nach Excel
2. **Zusätzliche Filter** - Nach Priority, Category, Date Range
3. **Sortierung** - Tabellen-Spalten sortierbar machen
4. **Suchfunktion** - Volltextsuche in Descriptions
5. **Edit-Funktion** - Work Orders direkt bearbeiten
6. **Backend-Integration** - Work Orders in Datenbank speichern
7. **Bulk-Actions** - Mehrere Orders auf einmal bearbeiten

---

## 🎉 Status

✅ **Vollständig implementiert und getestet!**

- Excel-Import funktioniert
- Main WorkCenter Filter aktiv
- Statistiken werden angezeigt
- UI ist responsive und Dark Mode ready
- Error Handling vorhanden

**Bereit für Production!** 🚀
