# Plant-Based Access Control - Implementierungsübersicht

## Überblick

Das System implementiert eine strikte anlagenbasierte Zugriffskontrolle für alle Ressourcen (Actions, Projects, etc.). User, die einer spezifischen Anlage zugewiesen sind, können nur auf Daten ihrer eigenen Anlage zugreifen.

## Benutzergruppen

### 1. Admin & Manager

- **Rollen**: `ADMIN`, `MANAGER`
- **assignedPlant**: `null`
- **Zugriff**: Vollzugriff auf alle Anlagen (T207, T208, T700, T46)
- **Beispiel**: admin@example.com

### 2. Normale User ohne Anlagenzuweisung

- **Rolle**: `USER`
- **assignedPlant**: `null`
- **Zugriff**: Vollzugriff auf alle Anlagen
- **Beispiel**: user@example.com

### 3. Anlagen-spezifische User

- **Rolle**: `USER`
- **assignedPlant**: `T207`, `T208`, `T700`, oder `T46`
- **Zugriff**: NUR auf die zugewiesene Anlage
- **Beispiele**:
  - elektriker.t207@rigcrew.com → Nur T207
  - mechaniker.t208@rigcrew.com → Nur T208
  - toolpusher.t700@rigcrew.com → Nur T700
  - rigmanager.t46@rigcrew.com → Nur T46

## Pro Anlage (aktuell: T207)

Für jede Anlage gibt es folgende Rollen:

- **Elektriker** (elektriker.t207@rigcrew.com)
- **Mechaniker** (mechaniker.t207@rigcrew.com)
- **Toolpusher** (toolpusher.t207@rigcrew.com)
- **Rig Manager** (rigmanager.t207@rigcrew.com)
- **Supply Coordinator** (supply.t207@rigcrew.com)

**Standard-Passwort für Crew**: `rig123`

## Implementierte Zugriffskontrolle

### Actions (backend/src/routes/actions.ts)

#### GET /api/actions

- **Middleware**: `filterByAssignedPlant`
- **Verhalten**:
  - Admin/Manager: Sehen alle Actions
  - Normale User ohne Plant: Sehen alle Actions
  - Plant-User: Sehen nur Actions ihrer Anlage (automatischer Filter)

#### GET /api/actions/:id

- **Middleware**: `filterByAssignedPlant`
- **Verhalten**:
  - Prüft ob Action zur Anlage des Users gehört
  - 403 Fehler bei Cross-Plant Zugriff

#### POST /api/actions

- **Middleware**: `validatePlantAccess`
- **Verhalten**:
  - Plant-User können nur Actions für ihre Anlage erstellen
  - Plant wird automatisch auf assignedPlant gesetzt
  - 403 Fehler bei Versuch, Action für andere Anlage zu erstellen

#### PUT /api/actions/:id

- **Middleware**: `validatePlantAccess`
- **Verhalten**:
  - Prüft ob Action zur Anlage gehört
  - Plant-User können nur Actions ihrer Anlage bearbeiten
  - 403 Fehler bei Cross-Plant Zugriff

#### DELETE /api/actions/:id

- **Verhalten**:
  - Prüft ob Action zur Anlage gehört
  - Plant-User können nur Actions ihrer Anlage löschen
  - 403 Fehler bei Cross-Plant Zugriff

### Projects (backend/src/controllers/project.controller.ts)

#### GET /api/projects

- **Verhalten**:
  - Admin/Manager: Sehen alle Projekte
  - Normale User ohne Plant: Sehen alle Projekte
  - Plant-User: Sehen nur Projekte ihrer Anlage (Filter: projectNumber = assignedPlant)

#### GET /api/projects/:id

- **Verhalten**:
  - Prüft ob Project zur Anlage gehört
  - 403 Fehler bei Cross-Plant Zugriff

#### POST /api/projects

- **Verhalten**:
  - Plant-User können nur Projekte für ihre Anlage erstellen
  - projectNumber muss assignedPlant entsprechen
  - 403 Fehler bei Versuch, Projekt für andere Anlage zu erstellen

#### PUT /api/projects/:id

- **Verhalten**:
  - Prüft ob Project zur Anlage gehört
  - Plant-User können nur Projekte ihrer Anlage bearbeiten
  - 403 Fehler bei Cross-Plant Zugriff

#### DELETE /api/projects/:id

- **Verhalten**:
  - Prüft ob Project zur Anlage gehört
  - Plant-User können nur Projekte ihrer Anlage löschen
  - 403 Fehler bei Cross-Plant Zugriff

## Middleware-Funktionen

### filterByAssignedPlant

**Datei**: `backend/src/middleware/plant-access.middleware.ts`

```typescript
// Anwendung:
router.get('/', authenticateToken, filterByAssignedPlant, async (req, res) => {...});
```

**Funktion**:

1. Admin/Manager → Bypass, kein Filter
2. Normale User ohne Plant → Bypass, kein Filter
3. Plant-User:
   - Fügt automatisch `plant` Filter zur Query hinzu
   - Blockt Zugriff wenn anderer Plant in Query angegeben

**Antwort bei Zugriffsverletzung**:

```json
{
  "error": "Access denied",
  "message": "You can only access T207 plant"
}
```

### validatePlantAccess

**Datei**: `backend/src/middleware/plant-access.middleware.ts`

```typescript
// Anwendung:
router.post('/', authenticateToken, validatePlantAccess, async (req, res) => {...});
router.put('/:id', authenticateToken, validatePlantAccess, async (req, res) => {...});
```

**Funktion**:

1. Admin/Manager → Bypass, keine Prüfung
2. Normale User ohne Plant → Bypass, keine Prüfung
3. Plant-User:
   - Setzt automatisch `plant` im Body auf assignedPlant
   - Blockt wenn anderer Plant im Body angegeben

**Antwort bei Zugriffsverletzung**:

```json
{
  "error": "Access denied",
  "message": "You can only create/modify actions for T207"
}
```

## JWT Token

Der Access Token enthält jetzt auch das Feld `assignedPlant`:

```typescript
{
  id: "user-id",
  email: "elektriker.t207@rigcrew.com",
  role: "USER",
  assignedPlant: "T207"
}
```

## Database Schema

```prisma
model User {
  // ... andere Felder
  assignedPlant String? // T208, T207, T700, T46, oder null
}

model Action {
  // ... andere Felder
  plant String // T208, T207, T700, T46
}

model Project {
  // ... andere Felder
  projectNumber String // T208, T207, T700, T46
}
```

## Testszenarien

### Test 1: T207 User versucht T208 Action zu sehen

```
User: elektriker.t207@rigcrew.com
Aktion: GET /api/actions?plant=T208
Ergebnis: ❌ 403 Forbidden - "You can only access T207 plant"
```

### Test 2: T207 User sieht nur T207 Actions

```
User: elektriker.t207@rigcrew.com
Aktion: GET /api/actions
Ergebnis: ✅ Nur Actions mit plant="T207" werden zurückgegeben
```

### Test 3: T207 User erstellt T208 Action

```
User: elektriker.t207@rigcrew.com
Aktion: POST /api/actions { plant: "T208", ... }
Ergebnis: ❌ 403 Forbidden - "You can only create/modify actions for T207"
```

### Test 4: T207 User erstellt T207 Action

```
User: elektriker.t207@rigcrew.com
Aktion: POST /api/actions { plant: "T207", title: "Test" }
Ergebnis: ✅ Action wird erstellt
```

### Test 5: Admin sieht alle Actions

```
User: admin@example.com
Aktion: GET /api/actions
Ergebnis: ✅ Alle Actions aller Anlagen werden zurückgegeben
```

### Test 6: Normaler User ohne Plant

```
User: user@example.com (assignedPlant: null)
Aktion: GET /api/actions
Ergebnis: ✅ Alle Actions aller Anlagen werden zurückgegeben
```

## Fehlermeldungen

### 403 Forbidden - Actions

```json
{
  "error": "Access denied",
  "message": "You can only access T207 actions"
}
```

### 403 Forbidden - Projects

```json
{
  "success": false,
  "message": "Access denied. You can only access T207 projects"
}
```

## Zusammenfassung

✅ **Implementiert**:

- Zugriffskontrolle für Actions (GET, POST, PUT, DELETE)
- Zugriffskontrolle für Projects (GET, POST, PUT, DELETE)
- Middleware für automatische Filterung und Validierung
- JWT Token mit assignedPlant Claim

⚠️ **Zu beachten**:

- Admin und Manager haben immer Vollzugriff
- Normale User ohne assignedPlant haben Vollzugriff
- Plant-User sind strikt auf ihre Anlage beschränkt
- Cross-Plant Zugriff wird mit 403 Fehler blockiert

🔄 **Nächste Schritte**:

- Frontend-UI anpassen (Plant-Dropdown verstecken für Plant-User)
- Weitere Ressourcen schützen (Tasks, Files, etc.)
- Tests schreiben für alle Szenarien
