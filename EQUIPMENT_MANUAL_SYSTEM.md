# Equipment Manual Management System (BETA)

## Übersicht

Das Equipment Manual Management System ermöglicht es Administratoren, Equipment-Handbücher (PDF) hochzuladen und automatisch wichtige Informationen durch AI zu extrahieren.

**SAP IH01-inspirierte Struktur** - Ähnlich wie SAP's Equipment Management, aber mit modernem shadcn/ui Design.

## Features

### 1. **Manual Upload**
- PDF-Upload (bis 50MB)
- Equipment-Informationen erfassen:
  - Equipment Name (Pflicht)
  - Equipment Nummer
  - Hersteller
  - Modell
  - Seriennummer
  - Anlage (T208, T209, T210) (Pflicht)
  - Standort auf Rig

### 2. **AI-gestützte Extraktion**
Nach dem Upload analysiert die AI automatisch das Manual und extrahiert:

#### **Wartungspläne (Maintenance Schedules)**
- Aufgabenname
- Beschreibung
- Intervall (z.B. "500h", "Monthly", "Annually")
- Priorität (LOW, MEDIUM, HIGH, CRITICAL)
- Kategorie (Lubrication, Inspection, Replacement)
- Geschätzte Dauer
- Benötigte Werkzeuge
- Sicherheitshinweise

#### **Ersatzteile (Spare Parts)**
- Teilenummer
- Teilename
- Beschreibung
- Kategorie
- Hersteller
- Austauschintervall
- Kritisches Teil (Ja/Nein)

#### **Technische Spezifikationen**
- Kategorien (Performance, Dimensions, Electrical)
- Parameter mit Werten und Einheiten
- Notizen

### 3. **Moderne UI mit shadcn/ui**
- Responsive Design
- Dark Mode Support
- Tab-Navigation (Übersicht, Wartung, Ersatzteile, Spezifikationen)
- Such- und Filterfunktionen
- Status-Badges für AI-Verarbeitung

### 4. **Admin-Only Zugriff**
- Nur Admins können diese Seite sehen
- BETA Badge in Sidebar
- Sichere Backend-Routes

## Datenbank Schema

### EquipmentManual
```prisma
model EquipmentManual {
  id                String
  equipmentName     String
  equipmentNumber   String?
  manufacturer      String?
  model             String?
  serialNumber      String?
  plant             String
  location          String?
  manualFileName    String
  manualFilePath    String
  manualFileSize    Int
  aiProcessed       Boolean
  summary           String?
  maintenanceSchedules MaintenanceSchedule[]
  spareParts           SparePart[]
  specifications       Specification[]
}
```

### MaintenanceSchedule
```prisma
model MaintenanceSchedule {
  taskName          String
  interval          String
  intervalHours     Int?
  intervalDays      Int?
  priority          String
  category          String?
  estimatedDuration String?
  requiredTools     String?
  safetyNotes       String?
}
```

### SparePart
```prisma
model SparePart {
  partNumber        String
  partName          String
  category          String?
  manufacturer      String?
  replacementInterval String?
  criticalPart      Boolean
}
```

### Specification
```prisma
model Specification {
  category          String
  name              String
  value             String
  unit              String?
}
```

## API Endpoints

### GET /api/equipment-manuals
Alle Manuals abrufen (mit Relations)

### GET /api/equipment-manuals/:id
Einzelnes Manual abrufen

### POST /api/equipment-manuals/upload
Manual hochladen
- Multipart/form-data
- File: PDF
- Body: Equipment-Informationen

### POST /api/equipment-manuals/:id/process
AI-Verarbeitung starten
- Extrahiert Wartungspläne, Ersatzteile, Spezifikationen
- Aktuell: Sample-Daten (TODO: Echte AI-Integration)

### DELETE /api/equipment-manuals/:id
Manual löschen

## Verwendung

### 1. Manual hochladen
1. Navigieren Sie zu **Equipment Manuals** (nur für Admins sichtbar)
2. Klicken Sie auf **"Manual hochladen"**
3. Füllen Sie die Equipment-Informationen aus
4. Wählen Sie die PDF-Datei
5. Klicken Sie auf **"Hochladen & Analysieren"**

### 2. Manual ansehen
1. Klicken Sie auf das Auge-Symbol in der Tabelle
2. Tabs durchsuchen:
   - **Übersicht**: Equipment-Info und AI-Zusammenfassung
   - **Wartung**: Extrahierte Wartungspläne
   - **Ersatzteile**: Teileliste mit Nummern
   - **Spezifikationen**: Technische Daten

### 3. Manual herunterladen
- Original-PDF jederzeit über Download-Button verfügbar

## Zukünftige Features

### Phase 2: Echte AI-Integration
- OpenAI GPT-4 oder Claude für PDF-Analyse
- Automatische Textextraktion aus Tabellen
- Intelligente Erkennung von:
  - Wartungsintervallen
  - Teilenummern
  - Spezifikationstabellen

### Phase 3: Work Order Integration
- Automatische Work Order Erstellung basierend auf Intervallen
- Equipment-Tracking mit Betriebsstunden
- Erinnerungen für fällige Wartung

### Phase 4: Ersatzteillager
- Bestandsverwaltung
- Mindestbestandswarnung
- Bestellvorschläge

### Phase 5: Equipment Hierarchie (SAP IH01)
- Funktionale Standorte
- Equipment-Struktur
- BOM (Bill of Materials)
- Equipment History

## Technische Details

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: shadcn/ui (Radix UI + Tailwind)
- **File Upload**: Multipart FormData
- **State Management**: React useState/useEffect

### Backend
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **File Storage**: Cloudinary
- **Authentication**: JWT with role-based access

### Storage
- PDFs werden auf Cloudinary hochgeladen
- Ordner: `cmms-erp/equipment-manuals`
- Maximale Dateigröße: 50MB

## Sicherheit

- ✅ Admin-only Zugriff (Frontend + Backend)
- ✅ PDF-Validierung (nur .pdf erlaubt)
- ✅ Dateigröße-Limit (50MB)
- ✅ Cloudinary Secure URLs
- ✅ Input-Sanitierung
- ✅ CORS Protection

## Troubleshooting

### Manual wird nicht verarbeitet?
- Überprüfen Sie, ob AI-Processing Endpoint aufgerufen wurde
- Aktuell werden Sample-Daten erstellt (echte AI kommt in Phase 2)

### Upload schlägt fehl?
- Überprüfen Sie Cloudinary-Konfiguration (.env)
- Prüfen Sie Dateigröße (<50MB)
- Nur PDF-Dateien erlaubt

### Keine Daten sichtbar?
- Überprüfen Sie Datenbankverbindung
- Prisma Client regenerieren: `npx prisma generate`
- Backend neustarten

## Status: BETA

Dieses Feature ist in aktiver Entwicklung. Feedback willkommen!

**Nächste Schritte:**
1. Echte AI-Integration mit GPT-4/Claude
2. Testing mit echten Equipment-Manuals
3. Work Order Auto-Creation
4. SAP IH01 Struktur erweitern

---

**Version**: 1.0.0-beta  
**Erstellt**: November 2025  
**Autor**: MaintAIn Team
