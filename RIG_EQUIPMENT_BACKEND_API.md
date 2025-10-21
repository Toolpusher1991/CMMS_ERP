# RIG & EQUIPMENT MANAGEMENT SYSTEM - Backend API

## ✅ System Status

Das Backend-System für Rig- und Equipment-Management ist vollständig eingerichtet und funktionsfähig!

### Was wurde implementiert:

1. **Prisma Datenbank-Modelle**

   - `Rig` - Bohranlage mit allen technischen Spezifikationen
   - `Equipment` - Equipment-Items mit dynamischen Properties

2. **Backend API Routes**

   - `/api/rigs` - Rig-Management
   - `/api/equipment` - Equipment-Management

3. **Admin-Berechtigung**
   - Nur Benutzer mit Rolle "ADMIN" können Daten bearbeiten
   - GET-Requests sind öffentlich (keine Authentifizierung nötig)
   - POST/PUT/DELETE erfordern Admin-Login

---

## 📊 Datenbank-Modelle

### Rig Model

```prisma
model Rig {
  id                String   @id @default(uuid())
  name              String   @unique // T700, T46, T350, etc.
  category          String   // Schwerlast, Mittlere Leistung, Kompakt

  // Technical Specifications
  maxDepth          Int      // in meters
  maxHookLoad       Int      // in tons
  footprint         String   // Klein, Mittel, Groß
  rotaryTorque      Int      // in Nm
  pumpPressure      Int      // in psi

  // Equipment Details (editierbar durch Admin)
  drawworks         String   // z.B. "2000 HP"
  mudPumps          String   // z.B. "2x 2200 HP Triplex"
  topDrive          String   // z.B. "1000 HP"
  derrickCapacity   String   // z.B. "1000 t"
  crewSize          String   // z.B. "45-50"
  mobilizationTime  String   // z.B. "30-45 Tage"

  // Pricing
  dayRate           String   // Tagesrate in EUR

  // Description
  description       String
  applications      String   // JSON array as string
  technicalSpecs    String

  // Audit
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastEditedBy      String?  // Admin user ID
}
```

### Equipment Model

```prisma
model Equipment {
  id          String   @id @default(uuid())
  category    String   // drillPipe, tanks, power, camps, safety, mud, bop, cranes, misc
  name        String
  price       String   // Preis in EUR

  // Dynamic Properties (stored as JSON)
  properties  String   // JSON object with custom key-value pairs

  // Audit
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?  // Admin user ID
  lastEditedBy String? // Admin user ID
}
```

---

## 🔌 API Endpunkte

### Rigs API

#### GET /api/rigs

Lädt alle Bohranlagen (öffentlich, keine Auth erforderlich)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "T700",
      "category": "Schwerlast",
      "maxDepth": 7000,
      "maxHookLoad": 700,
      "drawworks": "2000 HP",
      "mudPumps": "2x 2200 HP Triplex",
      "topDrive": "1000 HP",
      "dayRate": "85000",
      ...
    }
  ]
}
```

#### GET /api/rigs/:id

Lädt eine spezifische Bohranlage

#### POST /api/rigs (Admin only)

Erstellt eine neue Bohranlage

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Body:**

```json
{
  "name": "T350",
  "category": "Mittlere Leistung",
  "maxDepth": 4500,
  "maxHookLoad": 350,
  "footprint": "Mittel",
  "rotaryTorque": 45000,
  "pumpPressure": 5500,
  "drawworks": "1200 HP",
  "mudPumps": "2x 1200 HP Triplex",
  "topDrive": "500 HP",
  "derrickCapacity": "450 t",
  "crewSize": "30-35",
  "mobilizationTime": "20-25 Tage",
  "dayRate": "48000",
  "description": "Ausgewogene Lösung für mittlere Bohrtiefen",
  "applications": ["Mittlere Bohrungen", "Onshore"],
  "technicalSpecs": "Kompaktes Design, modularer Aufbau"
}
```

#### PUT /api/rigs/:id (Admin only)

Aktualisiert eine existierende Bohranlage

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Body:** (alle Felder optional, nur geänderte Felder schicken)

```json
{
  "drawworks": "1500 HP",
  "mudPumps": "2x 1600 HP Triplex",
  "topDrive": "750 HP",
  "dayRate": "65000"
}
```

#### DELETE /api/rigs/:id (Admin only)

Löscht eine Bohranlage

**Headers:**

```
Authorization: Bearer <admin-token>
```

---

### Equipment API

#### GET /api/equipment

Lädt alle Equipment-Items (öffentlich)

**Query Parameters:**

- `category` (optional) - Filter nach Kategorie

**Beispiel:** `/api/equipment?category=drillPipe`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "category": "drillPipe",
      "name": "5\" Bohrgestänge (Drill Pipe)",
      "price": "450",
      "properties": {
        "spec": "API 5DP S-135, 19.5 lb/ft",
        "connection": "NC50",
        "quantity": "300 Stangen"
      }
    }
  ]
}
```

#### GET /api/equipment/:id

Lädt ein spezifisches Equipment-Item

#### POST /api/equipment (Admin only)

Erstellt ein neues Equipment-Item

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Body:**

```json
{
  "category": "tanks",
  "name": "Spülungstank 500 bbl",
  "price": "1800",
  "properties": {
    "capacity": "79.5 m³",
    "type": "Aktiv-Tank",
    "agitator": "2x 50 HP"
  }
}
```

#### PUT /api/equipment/:id (Admin only)

Aktualisiert ein Equipment-Item

#### DELETE /api/equipment/:id (Admin only)

Löscht ein Equipment-Item

---

## 🔐 Authentifizierung & Berechtigungen

### Admin-Check

Alle POST, PUT, DELETE Operationen erfordern:

1. Gültigen JWT-Token im Authorization Header
2. User-Rolle muss "ADMIN" sein

**Beispiel Header:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Fehler-Responses

**401 Unauthorized** (kein/ungültiger Token):

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**403 Forbidden** (kein Admin):

```json
{
  "success": false,
  "message": "Zugriff verweigert. Nur Administratoren können diese Aktion ausführen."
}
```

---

## 💾 Datenbank Migration

Die Migration wurde bereits ausgeführt:

```bash
✔ Migration `20251021110815_add_rigs_and_equipment` applied
✔ Prisma Client generated
```

### Datenbank-Struktur

Die SQLite-Datenbank befindet sich unter:

```
backend/prisma/dev.db
```

Tabellen:

- `rigs` - Alle Bohranlagen
- `equipment` - Alle Equipment-Items

---

## 🚀 Server-Status

✅ **Backend läuft auf:**

- http://localhost:3000
- http://0.0.0.0:3000

✅ **Verfügbare Routen:**

- `/api/rigs` - Rig Management
- `/api/equipment` - Equipment Management
- `/api/auth` - Authentifizierung
- `/api/users` - User Management
- `/api/projects` - Projekt Management
- `/api/actions` - Action Tracker
- `/api/files` - File Management

---

## 📝 Nächste Schritte

### Frontend Integration

Du kannst jetzt im RigConfigurator die Daten vom Backend laden:

```typescript
// Service erstellen: src/services/rig.service.ts
import { apiClient } from "./api";

export const rigService = {
  async getAllRigs() {
    const response = await apiClient.get("/rigs");
    return response.data;
  },

  async updateRig(id: string, data: any) {
    const response = await apiClient.put(`/rigs/${id}`, data);
    return response.data;
  },
};

// Im RigConfigurator verwenden:
useEffect(() => {
  const loadRigs = async () => {
    const result = await rigService.getAllRigs();
    if (result.success) {
      setRigs(result.data);
    }
  };
  loadRigs();
}, []);
```

### Admin-UI für Rig-Bearbeitung

Du kannst jetzt ein Admin-Panel bauen, wo Admins folgende Felder bearbeiten können:

- ✏️ Drawworks (z.B. "2000 HP")
- ✏️ Mud Pumps (z.B. "2x 2200 HP Triplex")
- ✏️ Top Drive (z.B. "1000 HP")
- ✏️ Derrick Capacity (z.B. "1000 t")
- ✏️ Crew Size (z.B. "45-50")
- ✏️ Mobilization Time (z.B. "30-45 Tage")
- ✏️ Day Rate (Tagesrate in EUR)

### Test-Admin-User

Um die Admin-Funktionen zu testen, brauchst du einen User mit `role: "ADMIN"` in der Datenbank.

---

## ✅ System-Check

- ✅ Prisma Schema aktualisiert (Rig + Equipment Modelle)
- ✅ Migration erstellt und ausgeführt
- ✅ Backend-Routes implementiert (rigs.routes.ts + equipment.routes.ts)
- ✅ Admin-Middleware konfiguriert
- ✅ Routes zum Server hinzugefügt
- ✅ TypeScript kompiliert ohne Fehler
- ✅ Server läuft erfolgreich auf Port 3000

**Status: 🟢 BEREIT FÜR NUTZUNG**
