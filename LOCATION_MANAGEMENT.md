# Location Management System - Dokumentation

## Übersicht

Das Location Management System ermöglicht es Administratoren, die verfügbaren Standorte für Actions und Schadensmeldungen zentral zu verwalten. Die Standorte werden im localStorage gespeichert und sind somit persistent über Sitzungen hinweg.

## Features

### ✅ Zentrale Standort-Konfiguration

- **Einzelne Konfigurationsdatei**: `src/config/locations.ts`
- **Standard-Standorte**: TD, DW, MP1, MP2, MP3, PCR, Generatoren, Grid Container, Mud System
- **localStorage-Persistierung**: Änderungen bleiben erhalten

### ✅ Admin-Verwaltungsoberfläche

Die neue Komponente `LocationManagement` bietet:

- **Standorte anzeigen**: Übersicht aller Standorte mit ID, Name und Beschreibung
- **Neu hinzufügen**: Neue Standorte mit ID, Name und optionaler Beschreibung erstellen
- **Bearbeiten**: Bestehende Standorte anpassen
- **Löschen**: Standorte entfernen (mit Bestätigung)
- **Aktivieren/Deaktivieren**: Standorte temporär aus- oder einblenden ohne zu löschen
- **Zurücksetzen**: Alle Standorte auf Standardwerte zurücksetzen

### ✅ Integration

- **ActionTracker**: Zeigt Standort in Mobile-Cards, verwendet zentrale Location-Liste
- **FailureReporting**: Verwendet zentrale Location-Liste
- **Sidebar**: Neuer Menüeintrag "Standorte" (nur für Admins sichtbar)

## Verwendung

### Für Administratoren

1. **Standorte verwalten**:
   - Im Menü auf "Standorte" klicken (nur für Admins sichtbar)
   - Standorte hinzufügen, bearbeiten oder löschen
   - Mit dem Switch können Standorte temporär deaktiviert werden

2. **Standort hinzufügen**:
   - Button "Neuer Standort" klicken
   - **ID** (Pflicht): Kurzform (z.B. "TD", "MP1") - wird in GROSSBUCHSTABEN gespeichert
   - **Name** (Pflicht): Vollständiger Name (z.B. "Top Drive")
   - **Beschreibung** (Optional): Zusätzliche Informationen
   - **Aktiv**: Checkbox aktivieren für sofortige Sichtbarkeit

3. **Standorte zurücksetzen**:
   - Button "Zurücksetzen" klicken
   - Bestätigung erforderlich
   - Alle Standorte werden auf die 9 Standard-Standorte zurückgesetzt

### Für Entwickler

#### Location-Interface

```typescript
interface Location {
  id: string;           // Eindeutige ID (z.B. "TD", "MP1")
  name: string;         // Anzeigename (z.B. "Top Drive")
  description?: string; // Optionale Beschreibung
  active: boolean;      // Ist der Standort aktiv?
}
```

#### Verfügbare Funktionen

```typescript
import { 
  getLocations,        // Alle Standorte abrufen
  getActiveLocations,  // Nur aktive Standorte abrufen
  saveLocations,       // Standorte speichern
  resetLocations,      // Auf Standardwerte zurücksetzen
  DEFAULT_LOCATIONS    // Standard-Standorte-Array
} from "@/config/locations";
```

#### Beispiel: Dropdown mit Standorten

```typescript
import { getActiveLocations } from "@/config/locations";

// In der Komponente
<SelectContent>
  {getActiveLocations().map((location) => (
    <SelectItem key={location.id} value={location.id}>
      {location.name}
    </SelectItem>
  ))}
</SelectContent>
```

## Standard-Standorte

Die folgenden Standorte sind standardmäßig konfiguriert:

| ID | Name | Beschreibung |
|----|------|--------------|
| TD | Top Drive | Top Drive System |
| DW | Drawworks | Drawworks System |
| MP1 | Mud Pump 1 | Erste Schlammpumpe |
| MP2 | Mud Pump 2 | Zweite Schlammpumpe |
| MP3 | Mud Pump 3 | Dritte Schlammpumpe |
| PCR | Power Control Room | Energie-Kontrollraum |
| GEN | Generatoren | Stromgeneratoren |
| GC | Grid Container | Netz-Container |
| MS | Mud System | Schlammsystem |

## Technische Details

### Datenspeicherung

- **localStorage Key**: `cmms_locations`
- **Format**: JSON Array von Location-Objekten
- **Fallback**: Bei Fehler oder leerem Storage werden DEFAULT_LOCATIONS verwendet

### Komponenten-Struktur

```
src/
├── config/
│   └── locations.ts                    # Zentrale Konfiguration
├── components/
│   └── LocationManagement.tsx          # Admin-UI-Komponente
└── pages/
    ├── ActionTracker.tsx               # Nutzt getActiveLocations()
    └── FailureReporting.tsx            # Nutzt getActiveLocations()
```

### Mobile Ansicht

In der Mobile-Ansicht des ActionTracker wird der Standort jetzt angezeigt:

```typescript
<Badge variant="secondary" className="text-xs">
  <MapPin className="h-3 w-3 mr-1" />
  {action.location}
</Badge>
```

## Vorteile

1. **Zentrale Verwaltung**: Ein Ort für alle Standorte
2. **Keine Code-Änderungen**: Admins können Standorte ohne Entwickler ändern
3. **Persistent**: Änderungen bleiben erhalten
4. **Flexibel**: Standorte können temporär deaktiviert werden
5. **Einfache Integration**: Eine Funktion (`getActiveLocations()`) für alle Dropdowns
6. **Sichtbarkeit**: Standorte werden in der Mobile-Ansicht angezeigt

## Migration

Alle bestehenden Standort-Referenzen wurden automatisch auf die neue zentrale Konfiguration umgestellt:

- ✅ ActionTracker - Desktop Form
- ✅ ActionTracker - Mobile Cards
- ✅ FailureReporting - Desktop Form
- ✅ FailureReporting - Mobile Form

Bestehende Daten bleiben unverändert, da die IDs gleich geblieben sind.

## Zukünftige Erweiterungen

Mögliche Erweiterungen des Systems:

1. **Backend-Synchronisation**: Standorte in der Datenbank speichern für Multi-User-Sync
2. **Hierarchie**: Übergeordnete/Untergeordnete Standorte
3. **Bilder**: Icons oder Bilder für Standorte
4. **Koordinaten**: GPS-Koordinaten für Karten-Integration
5. **Berechtigungen**: Standort-spezifische Zugriffskontrolle
6. **Import/Export**: Standorte als CSV/Excel importieren/exportieren

## Support

Bei Fragen oder Problemen wenden Sie sich an das Entwicklungsteam.

---

**Version**: 1.0  
**Datum**: 25. Januar 2025  
**Status**: ✅ Produktiv
