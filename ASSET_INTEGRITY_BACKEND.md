# Asset Integrity Management - Backend Integration Guide

## Übersicht

Dieses Dokument beschreibt die Backend-Integration für das Asset Integrity Management System.

## Datenbankschema

### Tabelle: `rigs` (Bohranlagen)

```sql
CREATE TABLE rigs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL CHECK (region IN ('Oman', 'Pakistan')),
    contract_status VARCHAR(20) NOT NULL CHECK (contract_status IN ('active', 'idle', 'standby', 'maintenance')),
    contract_end_date DATE,
    operator VARCHAR(200),
    location VARCHAR(200) NOT NULL,
    day_rate INTEGER,
    certifications TEXT[], -- PostgreSQL Array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabelle: `rig_general_info` (Notizen/Informationen)

```sql
CREATE TABLE rig_general_info (
    id SERIAL PRIMARY KEY,
    rig_id INTEGER NOT NULL REFERENCES rigs(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    deadline DATE,
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabelle: `rig_inspections` (Inspektionen)

```sql
CREATE TABLE rig_inspections (
    id SERIAL PRIMARY KEY,
    rig_id INTEGER NOT NULL REFERENCES rigs(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('statutory', 'internal', 'client', 'certification')),
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    completed_date DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('upcoming', 'due', 'overdue', 'completed')),
    responsible VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabelle: `rig_issues` (Risiken/Probleme)

```sql
CREATE TABLE rig_issues (
    id SERIAL PRIMARY KEY,
    rig_id INTEGER NOT NULL REFERENCES rigs(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('safety', 'technical', 'compliance', 'commercial')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    due_date DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'in-progress', 'closed')),
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabelle: `rig_improvements` (Verbesserungen/Upgrades)

```sql
CREATE TABLE rig_improvements (
    id SERIAL PRIMARY KEY,
    rig_id INTEGER NOT NULL REFERENCES rigs(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('equipment', 'certification', 'compliance', 'efficiency')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    estimated_cost INTEGER NOT NULL,
    potential_revenue TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('planned', 'in-progress', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API-Endpunkte

### Rigs (Anlagen)

#### GET /api/asset-integrity/rigs

Alle Anlagen abrufen

**Response:**

```json
[
  {
    "id": "1",
    "name": "T700",
    "region": "Oman",
    "contractStatus": "active",
    "contractEndDate": "2026-08-15",
    "operator": "PDO",
    "location": "Fahud Field",
    "dayRate": 28000,
    "certifications": ["API Spec 7K", "ISO 9001:2015"],
    "generalInfo": [...],
    "inspections": [...],
    "issues": [...],
    "improvements": [...]
  }
]
```

#### GET /api/asset-integrity/rigs/:rigId

Einzelne Anlage abrufen

#### POST /api/asset-integrity/rigs

Neue Anlage erstellen

**Request Body:**

```json
{
  "name": "T800",
  "region": "Oman",
  "contractStatus": "idle",
  "operator": "PDO",
  "location": "Marmul Field",
  "dayRate": 32000,
  "contractEndDate": "2027-01-15"
}
```

#### PATCH /api/asset-integrity/rigs/:rigId

Anlage aktualisieren

**Request Body:**

```json
{
  "contractStatus": "active",
  "dayRate": 35000
}
```

#### DELETE /api/asset-integrity/rigs/:rigId

Anlage löschen

### General Info (Notizen)

#### POST /api/asset-integrity/rigs/:rigId/general-info

Neue Notiz hinzufügen

**Request Body:**

```json
{
  "description": "Rig Move nach Lekhwair geplant",
  "deadline": "2026-08-20"
}
```

#### PATCH /api/asset-integrity/rigs/:rigId/general-info/:infoId

Notiz aktualisieren

#### DELETE /api/asset-integrity/rigs/:rigId/general-info/:infoId

Notiz löschen

### Inspections

#### POST /api/asset-integrity/rigs/:rigId/inspections

Neue Inspektion hinzufügen

**Request Body:**

```json
{
  "type": "statutory",
  "description": "Annual BOP Stack Inspection",
  "dueDate": "2026-03-01",
  "responsible": "Third Party Inspector"
}
```

#### PATCH /api/asset-integrity/rigs/:rigId/inspections/:inspectionId

Inspektion aktualisieren

#### DELETE /api/asset-integrity/rigs/:rigId/inspections/:inspectionId

Inspektion löschen

### Issues (Risiken)

#### POST /api/asset-integrity/rigs/:rigId/issues

Neues Issue hinzufügen

**Request Body:**

```json
{
  "category": "technical",
  "severity": "medium",
  "description": "Mud pump #2 showing vibration",
  "dueDate": "2026-03-01"
}
```

#### PATCH /api/asset-integrity/rigs/:rigId/issues/:issueId

Issue aktualisieren

#### DELETE /api/asset-integrity/rigs/:rigId/issues/:issueId

Issue löschen

### Improvements (Verbesserungen)

#### POST /api/asset-integrity/rigs/:rigId/improvements

Neue Verbesserung hinzufügen

**Request Body:**

```json
{
  "description": "Install advanced drilling automation system",
  "category": "equipment",
  "priority": "high",
  "estimatedCost": 450000,
  "potentialRevenue": "Enables premium contracts (+$5k day rate)"
}
```

#### PATCH /api/asset-integrity/rigs/:rigId/improvements/:improvementId

Verbesserung aktualisieren

#### DELETE /api/asset-integrity/rigs/:rigId/improvements/:improvementId

Verbesserung löschen

### Reporting

#### POST /api/asset-integrity/meeting-overview

Meeting-Übersicht generieren

**Request Body:**

```json
{
  "rigIds": ["1", "2"] // Optional, wenn leer = alle Anlagen
}
```

**Response:**

```json
{
  "overview": "=== MEETING-ÜBERSICHT ===\n..."
}
```

## Backend Implementation (Node.js/Express Beispiel)

### Route-Datei: `backend/src/routes/assetIntegrity.ts`

```typescript
import express from "express";
import { pool } from "../db";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// GET all rigs
router.get("/rigs", authenticateToken, async (req, res) => {
  try {
    const rigsResult = await pool.query("SELECT * FROM rigs ORDER BY name");

    const rigs = await Promise.all(
      rigsResult.rows.map(async (rig) => {
        const [generalInfo, inspections, issues, improvements] =
          await Promise.all([
            pool.query(
              "SELECT * FROM rig_general_info WHERE rig_id = $1 ORDER BY created_date DESC",
              [rig.id],
            ),
            pool.query(
              "SELECT * FROM rig_inspections WHERE rig_id = $1 ORDER BY due_date",
              [rig.id],
            ),
            pool.query(
              "SELECT * FROM rig_issues WHERE rig_id = $1 ORDER BY created_date DESC",
              [rig.id],
            ),
            pool.query(
              "SELECT * FROM rig_improvements WHERE rig_id = $1 ORDER BY priority DESC",
              [rig.id],
            ),
          ]);

        return {
          id: rig.id.toString(),
          name: rig.name,
          region: rig.region,
          contractStatus: rig.contract_status,
          contractEndDate: rig.contract_end_date,
          operator: rig.operator,
          location: rig.location,
          dayRate: rig.day_rate,
          certifications: rig.certifications || [],
          generalInfo: generalInfo.rows.map(mapGeneralInfo),
          inspections: inspections.rows.map(mapInspection),
          issues: issues.rows.map(mapIssue),
          improvements: improvements.rows.map(mapImprovement),
        };
      }),
    );

    res.json(rigs);
  } catch (error) {
    console.error("Error fetching rigs:", error);
    res.status(500).json({ message: "Error fetching rigs" });
  }
});

// POST new rig
router.post("/rigs", authenticateToken, async (req, res) => {
  const {
    name,
    region,
    contractStatus,
    operator,
    location,
    dayRate,
    contractEndDate,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO rigs (name, region, contract_status, operator, location, day_rate, contract_end_date, certifications)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        region,
        contractStatus,
        operator,
        location,
        dayRate,
        contractEndDate,
        [],
      ],
    );

    const rig = result.rows[0];
    res.status(201).json({
      id: rig.id.toString(),
      name: rig.name,
      region: rig.region,
      contractStatus: rig.contract_status,
      operator: rig.operator,
      location: rig.location,
      dayRate: rig.day_rate,
      contractEndDate: rig.contract_end_date,
      certifications: [],
      generalInfo: [],
      inspections: [],
      issues: [],
      improvements: [],
    });
  } catch (error) {
    console.error("Error creating rig:", error);
    res.status(500).json({ message: "Error creating rig" });
  }
});

// Helper mapping functions
function mapGeneralInfo(row: any) {
  return {
    id: row.id.toString(),
    description: row.description,
    deadline: row.deadline,
    createdDate: row.created_date,
  };
}

function mapInspection(row: any) {
  return {
    id: row.id.toString(),
    type: row.type,
    description: row.description,
    dueDate: row.due_date,
    completedDate: row.completed_date,
    status: row.status,
    responsible: row.responsible,
  };
}

function mapIssue(row: any) {
  return {
    id: row.id.toString(),
    category: row.category,
    severity: row.severity,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
    createdDate: row.created_date,
  };
}

function mapImprovement(row: any) {
  return {
    id: row.id.toString(),
    description: row.description,
    category: row.category,
    priority: row.priority,
    estimatedCost: row.estimated_cost,
    potentialRevenue: row.potential_revenue,
    status: row.status,
  };
}

export default router;
```

### In `backend/src/index.ts` registrieren:

```typescript
import assetIntegrityRouter from "./routes/assetIntegrity";

app.use("/api/asset-integrity", assetIntegrityRouter);
```

## Nächste Schritte

1. ✅ Frontend API Service erstellt (`src/services/assetIntegrityApi.ts`)
2. ⏳ Datenbank-Migrationen ausführen (SQL-Skripte oben verwenden)
3. ⏳ Backend-Routes implementieren
4. ⏳ Frontend mit Backend verbinden (State Management mit API Calls ersetzen)
5. ⏳ GitHub Repository erstellen und Code pushen

## GitHub Setup

Siehe separates Dokument: `GITHUB_INTEGRATION.md`
