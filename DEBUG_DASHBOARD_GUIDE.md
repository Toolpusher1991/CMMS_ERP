# 🐛 System Debug Dashboard

## Was ist das?

Das System Debug Dashboard ist ein **Live-Diagnose-Tool**, das alle kritischen Systemfunktionen in Echtzeit testet und zeigt **genau**, was funktioniert und was nicht.

## Wie benutzen?

1. **In der Sidebar auf "System Debug" klicken**
2. **Button "Diagnostics starten" klicken**
3. **Ergebnisse ansehen** - grün = funktioniert, rot = Problem, gelb = Warnung

## Was wird getestet?

### ✅ Backend Tests

- **API Connection**: Kann das Frontend das Backend erreichen?
- **Database Connection**: Ist PostgreSQL verbunden?
- **Response Times**: Wie schnell antwortet das Backend?

### ✅ Authentication Tests

- **Token Validity**: Ist der Login-Token noch gültig?
- **User Session**: Sind die User-Daten korrekt?
- **Token Refresh**: Funktioniert das automatische Token-Refresh?

### ✅ Feature Tests

- **Photo Loading**: Funktioniert die neue Blob API für Fotos?
- **Project Categories**: Werden Kategorien korrekt geladen?
- **Failure Reports**: Laden Schadensmeldungen mit Fotos?
- **Actions API**: Funktioniert der Action Tracker?

### ✅ Error Reporting

- **Sentry Configuration**: Ist Sentry konfiguriert?
- **Error Tracking**: Werden Fehler gemeldet?

## Wann benutzen?

### 🚨 Problem-Szenarien:

1. **"Fotos werden nicht angezeigt"** → Schau auf "Photo Loading (Blob API)" Result
2. **"Kategorien speichern nicht"** → Schau auf "Project Categories" Result
3. **"Backend nicht erreichbar"** → Schau auf "API Connection" Result
4. **"Login funktioniert nicht"** → Schau auf "Authentication" Result
5. **"Sentry meldet nichts"** → Schau auf "Sentry" Result

## Quick Actions

### 🔧 **Log Frontend State**

Zeigt alle wichtigen Frontend-Daten in der Browser-Konsole:

- LocalStorage Inhalt
- API URLs
- Current User
- Token Status

### 🔄 **Clear Cache & Logout**

Löscht alle gespeicherten Daten und loggt aus (bei Cache-Problemen)

### 🧪 **Test Sentry Error**

Wirft einen Test-Error um Sentry zu testen

### 🌐 **Open API Health**

Öffnet die Backend Health-Page direkt im Browser

## Debug-Informationen verstehen

### System Information

```
Frontend URL: http://localhost:5173
API Base URL: http://localhost:5137/api
Sentry DSN: ✅ Configured
Environment: development
```

### Test Results Format

```
✅ SUCCESS: Alles funktioniert
⚠️ WARNING: Funktioniert, aber Vorsicht
❌ ERROR: Funktioniert nicht!
```

Jedes Result zeigt:

- **Name**: Was wurde getestet
- **Status**: Success/Warning/Error
- **Message**: Kurze Beschreibung
- **Timing**: Wie lange hat es gedauert (ms)
- **Details**: Technische Details (klickbar)

## Typische Probleme & Lösungen

### ❌ "API Connection" Failed

**Problem**: Frontend kann Backend nicht erreichen
**Lösung**:

1. Backend läuft? → `cd backend && npm run dev`
2. Richtige URL? → Check `VITE_API_URL` in `.env`
3. CORS Problem? → Check Backend CORS Config

### ❌ "Authentication" Failed

**Problem**: Token ungültig
**Lösung**:

1. Neu einloggen
2. "Clear Cache & Logout" nutzen
3. Check ob Backend läuft

### ❌ "Photo Loading" Failed

**Problem**: Blob API funktioniert nicht
**Lösung**:

1. Check Backend photo route
2. Check CORS headers
3. Check Datei existiert

### ❌ "Database Connection" Failed

**Problem**: PostgreSQL nicht erreichbar
**Lösung**:

1. PostgreSQL läuft?
2. `DATABASE_URL` korrekt?
3. Prisma Migration gelaufen?

### ⚠️ "Sentry" Warning

**Problem**: Sentry nicht konfiguriert
**Lösung**:

1. `VITE_SENTRY_DSN` in `.env` setzen
2. Für Development optional
3. Für Production **zwingend**!

## Production Use

Das Debug Dashboard funktioniert auch in Production!

**Wichtig**:

- Zeigt echte Production-Daten
- Nutzt echte API Endpoints
- Kann Performance-Impact haben (nicht permanent laufen lassen)

## Für Entwickler

### Neuen Test hinzufügen

```typescript
const testMyFeature = async () => {
  const start = Date.now();
  try {
    const result = await apiClient.get("/my-endpoint");
    const timing = Date.now() - start;

    addResult({
      name: "My Feature",
      status: "success",
      message: `Feature works (${timing}ms)`,
      details: JSON.stringify(result, null, 2),
      timing,
    });
  } catch (error) {
    addResult({
      name: "My Feature",
      status: "error",
      message: "Feature failed",
      details: error.message,
    });
  }
};
```

### Debug Result Structure

```typescript
interface DebugResult {
  name: string; // Display name
  status: "success" | "error" | "warning";
  message: string; // Short description
  details?: string; // Expandable technical info
  timing?: number; // Response time in ms
}
```

## Support

Bei Problemen:

1. **Screenshots vom Debug Dashboard machen**
2. **"Details anzeigen" klicken** für technische Infos
3. **Browser Console öffnen** (F12) für Logs
4. **Alle Infos zusammen an Support schicken**

Das Debug Dashboard zeigt **genau** was nicht funktioniert - kein Raten mehr! 🎯
