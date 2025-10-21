# Action Tracker Backend API

## Overview

Das Action Tracker Backend bietet vollständige CRUD-Operationen für Actions und File-Uploads.

## Models

### Action

```typescript
{
  id: string;              // UUID
  plant: string;           // T208, T207, T700, T46
  title: string;
  description?: string;
  status: string;          // OPEN, IN_PROGRESS, COMPLETED
  priority: string;        // LOW, MEDIUM, HIGH, URGENT
  assignedTo?: string;
  dueDate?: DateTime;
  completedAt?: DateTime;
  createdBy?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  actionFiles: ActionFile[];
}
```

### ActionFile

```typescript
{
  id: string;              // UUID
  actionId: string;
  filename: string;        // Stored filename (with timestamp)
  originalName: string;    // Original uploaded filename
  fileType: string;        // MIME type
  fileSize: number;        // in bytes
  filePath: string;        // relative path
  isPhoto: boolean;        // true for images, false for documents
  uploadedBy?: string;
  uploadedAt: DateTime;
}
```

## API Endpoints

### GET /api/actions

Hole alle Actions (mit optionalen Filtern)

**Query Parameters:**

- `plant` - Filter nach Anlage (T208, T207, T700, T46)
- `status` - Filter nach Status (OPEN, IN_PROGRESS, COMPLETED)
- `priority` - Filter nach Priorität (LOW, MEDIUM, HIGH, URGENT)

**Response:**

```json
[
  {
    "id": "uuid",
    "plant": "T208",
    "title": "Action Title",
    "status": "OPEN",
    "priority": "HIGH",
    "actionFiles": [...]
  }
]
```

### GET /api/actions/:id

Hole einzelne Action mit allen Files

**Response:**

```json
{
  "id": "uuid",
  "plant": "T208",
  "title": "Action Title",
  "description": "Details...",
  "status": "OPEN",
  "priority": "HIGH",
  "assignedTo": "John Doe",
  "dueDate": "2025-10-25T00:00:00Z",
  "actionFiles": [
    {
      "id": "uuid",
      "filename": "1729512345678-report.pdf",
      "originalName": "report.pdf",
      "fileType": "application/pdf",
      "fileSize": 524288,
      "isPhoto": false
    }
  ]
}
```

### POST /api/actions

Erstelle neue Action

**Body:**

```json
{
  "plant": "T208",
  "title": "New Action",
  "description": "Optional description",
  "status": "OPEN",
  "priority": "MEDIUM",
  "assignedTo": "John Doe",
  "dueDate": "2025-10-25"
}
```

**Required Fields:**

- `plant` (must be: T208, T207, T700, or T46)
- `title`

**Response:** Created Action object

### PUT /api/actions/:id

Aktualisiere Action

**Body:** (alle Felder optional)

```json
{
  "title": "Updated Title",
  "status": "COMPLETED",
  "priority": "LOW"
}
```

**Special Behavior:**

- Wenn `status` auf `COMPLETED` geändert wird → `completedAt` wird automatisch gesetzt
- Wenn `status` von `COMPLETED` weg geändert wird → `completedAt` wird auf null gesetzt

**Response:** Updated Action object

### DELETE /api/actions/:id

Lösche Action

**Behavior:**

- Löscht Action aus Datenbank
- Löscht alle zugehörigen ActionFiles aus Datenbank (Cascade)
- Löscht alle zugehörigen Dateien vom Filesystem

**Response:**

```json
{
  "message": "Action deleted successfully"
}
```

### POST /api/actions/:id/files

Lade Files zu einer Action hoch

**Content-Type:** `multipart/form-data`

**Form Data:**

- `files` - Array von Files (max 10 gleichzeitig)

**Allowed File Types:**

- Images: jpeg, jpg, png, gif, webp
- Documents: pdf, doc, docx, xls, xlsx, txt, csv

**Max File Size:** 10MB pro File

**Response:** Array von erstellten ActionFile objects

```json
[
  {
    "id": "uuid",
    "filename": "1729512345678-photo.jpg",
    "originalName": "photo.jpg",
    "fileType": "image/jpeg",
    "fileSize": 524288,
    "isPhoto": true
  }
]
```

### DELETE /api/actions/:actionId/files/:fileId

Lösche einzelnes File

**Behavior:**

- Validiert, dass File zur Action gehört
- Löscht File vom Filesystem
- Löscht File-Eintrag aus Datenbank

**Response:**

```json
{
  "message": "File deleted successfully"
}
```

### GET /api/actions/files/:filename

Hole File (dient zum Download/Anzeigen)

**Response:** File als Binary Data

**Alternative:** Files sind auch statisch verfügbar unter:

```
GET /uploads/actions/:filename
```

## Frontend Integration

### Beispiel: Action erstellen und Files hochladen

```typescript
import { createAction, uploadFiles } from "@/services/actionService";

// 1. Action erstellen
const action = await createAction({
  plant: "T208",
  title: "Neue Wartungsarbeit",
  description: "Beschreibung...",
  status: "OPEN",
  priority: "HIGH",
  assignedTo: "Max Mustermann",
  dueDate: "2025-10-25",
});

// 2. Files hochladen
const files: File[] = [photo1, photo2, document1];
const uploadedFiles = await uploadFiles(action.id, files);

console.log("Action erstellt:", action);
console.log("Files hochgeladen:", uploadedFiles);
```

### Beispiel: Actions mit Filtern laden

```typescript
import { getActions } from "@/services/actionService";

// Alle Actions von T208 mit Status OPEN
const actions = await getActions({
  plant: "T208",
  status: "OPEN",
});
```

### Beispiel: File-URL generieren

```typescript
import { getFileUrl } from "@/services/actionService";

const fileUrl = getFileUrl(actionFile.filename);
// Zeige Bild an
<img src={fileUrl} alt={actionFile.originalName} />;
```

## Authentifizierung

Alle Endpoints benötigen einen gültigen JWT Token im Authorization Header:

```
Authorization: Bearer <token>
```

Der Token wird automatisch vom `api` Service hinzugefügt (aus localStorage).

## Error Handling

### Validation Errors (400)

```json
{
  "error": "Plant and title are required"
}
```

### Not Found (404)

```json
{
  "error": "Action not found"
}
```

### Server Errors (500)

```json
{
  "error": "Failed to create action"
}
```

## File Storage

Files werden gespeichert in:

```
backend/uploads/actions/
```

Dateinamen Format:

```
{timestamp}-{random}-{originalname}
Beispiel: 1729512345678-9876543210-report.pdf
```

## Nächste Schritte

1. **Frontend integrieren:**

   - ActionTracker.tsx umbauen auf API-Calls
   - Lokale Daten entfernen
   - API-Service nutzen

2. **Testing:**

   - API-Endpoints testen (Postman/Insomnia)
   - File-Uploads testen
   - Error Cases testen

3. **Production:**
   - Environment Variables setzen
   - Upload-Ordner Permissions prüfen
   - Backup-Strategie für Files
