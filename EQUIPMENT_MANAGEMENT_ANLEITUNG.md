# Equipment Management System - Anleitung

## 📦 Übersicht

Das Equipment Management System ermöglicht die vollständige Verwaltung von Equipment-Items im Bohranlagen-Konfigurator mit persistenter Speicherung.

## ✨ Features

### 1. Equipment hinzufügen

- **Button:** "Equipment hinzufügen" in jeder Kategorie
- **Pflichtfelder:**
  - Name (z.B. "5\" Bohrgestänge")
  - Preis (€ / Tag)
- **Optional:** Beliebige zusätzliche Eigenschaften (spec, capacity, etc.)

### 2. Equipment bearbeiten

- **Button:** ✏️ Edit-Icon bei jedem Equipment
- **Funktionen:**
  - Name ändern
  - Preis anpassen
  - Eigenschaften hinzufügen/entfernen/bearbeiten

### 3. Equipment löschen

- **Button:** 🗑️ Trash-Icon bei jedem Equipment
- **Sicherheit:** Bestätigungsdialog vor dem Löschen

### 4. Persistente Speicherung

- **Technologie:** localStorage
- **Automatisch:** Speichert bei jeder Änderung
- **Wiederherstellung:** Lädt automatisch beim Seitenaufruf

## 🎯 Workflow

### Equipment hinzufügen

```
1. Klicken Sie auf "Equipment hinzufügen" in einer Kategorie
2. Geben Sie Name und Preis ein
3. Optional: Fügen Sie zusätzliche Eigenschaften hinzu
   - Klick auf "+ Eigenschaft hinzufügen"
   - Eigenschaft-Name eingeben (z.B. "spec")
   - Wert eingeben (z.B. "API 5DP S-135")
4. Klick auf "Hinzufügen"
```

### Equipment bearbeiten

```
1. Klicken Sie auf das Edit-Icon (✏️) beim Equipment
2. Ändern Sie die gewünschten Felder
3. Klick auf "Speichern"
```

### Equipment löschen

```
1. Klicken Sie auf das Trash-Icon (🗑️)
2. Bestätigen Sie die Löschung
3. Equipment wird sofort entfernt
```

## 💾 Datenspeicherung

### LocalStorage Schlüssel

```javascript
"rigConfigurator_equipment";
```

### Datenstruktur

```json
{
  "drillPipe": {
    "name": "Bohrgestänge & Drill String",
    "icon": "Wrench",
    "items": [
      {
        "id": "dp1",
        "name": "5\" Bohrgestänge",
        "price": "450",
        "spec": "API 5DP S-135",
        "connection": "NC50",
        "quantity": "300 Stangen"
      }
    ]
  }
}
```

### Verfügbare Kategorien

1. **drillPipe** - Bohrgestänge & Drill String
2. **tanks** - Tanks & Silos
3. **power** - Stromversorgung
4. **camps** - Unterkünfte & Büros
5. **safety** - Sicherheit & Gas-Detektion
6. **mud** - Spülungssysteme
7. **bop** - BOP & Well Control
8. **cranes** - Krane & Hebetechnik
9. **misc** - Sonstiges

## 🔧 Dynamische Eigenschaften

Sie können beliebige Eigenschaften zu jedem Equipment hinzufügen:

### Beispiele

**Bohrgestänge:**

- spec: "API 5DP S-135, 19.5 lb/ft"
- connection: "NC50"
- quantity: "300 Stangen"
- length: "9.50m Range 2"

**Tanks:**

- capacity: "79.5 m³"
- type: "Aktiv-Tank"
- agitator: "2x 50 HP"
- material: "Stahl beschichtet"

**Generatoren:**

- power: "500 kW"
- voltage: "400V"
- fuelTank: "1000L"
- runtime: "24h"

## 🎨 UI-Komponenten

### Equipment-Liste

```tsx
<div className="flex items-center gap-2">
  <Checkbox /> {/* Auswahl */}
  <Name /> {/* Equipment-Name */}
  <Details /> {/* Zusätzliche Infos */}
  <Price /> {/* Preis */}
  <Edit /> {/* Bearbeiten-Button */}
  <Delete /> {/* Löschen-Button */}
</div>
```

### Equipment-Dialog

```tsx
- Titel: "Neues Equipment hinzufügen" / "Equipment bearbeiten"
- Felder:
  * Name (Pflicht)
  * Preis (Pflicht)
  * Dynamische Eigenschaften (Optional)
- Buttons:
  * Abbrechen
  * Hinzufügen/Speichern
```

## 🚀 Best Practices

### 1. Eindeutige IDs

- Verwenden Sie sprechende IDs: `dp1`, `tank1`, `gen1`
- Bei neuen Items: `${category}_${Date.now()}`

### 2. Preisformat

- Nur Zahlen eingeben (ohne €)
- System formatiert automatisch zu: € 450
- Anzeige als Tagesrate

### 3. Eigenschaften

- Verwenden Sie kurze, prägnante Namen
- Beispiel: "spec" statt "Specification"
- Werte können länger sein

### 4. Kategorien

- Nutzen Sie die vorhandenen Kategorien
- Neue Kategorien erfordern Code-Änderungen

## 📊 Export & Integration

### PDF-Export

- Ausgewählte Equipment-Items werden im PDF aufgelistet
- Preis-Kalkulation erfolgt automatisch
- Formatierung: Name + Preis

### Zusammenfassung

- Zeigt ausgewählte Equipment gruppiert nach Kategorie
- Summiert Gesamtkosten automatisch
- Berücksichtigt Projektdauer für Gesamtkalkulation

## 🔄 Synchronisation

### Zwischen Tabs

- Änderungen sind sofort in allen Ansichten sichtbar
- Auswahl bleibt erhalten
- Preisänderungen werden direkt übernommen

### Browser-übergreifend

- Daten sind pro Browser-Profil gespeichert
- Nicht synchronisiert zwischen verschiedenen Geräten
- Export via JSON möglich (zukünftig)

## 🛠️ Technische Details

### State Management

```typescript
const [equipmentCategories, setEquipmentCategories] = useState({...});
```

### LocalStorage

```typescript
// Speichern
localStorage.setItem("rigConfigurator_equipment", JSON.stringify(data));

// Laden
const saved = localStorage.getItem("rigConfigurator_equipment");
const data = JSON.parse(saved);
```

### Toast-Benachrichtigungen

- ✅ "Equipment hinzugefügt"
- ✅ "Equipment aktualisiert"
- ✅ "Equipment gelöscht"
- ✅ "Daten geladen"

## 🎯 Zukünftige Erweiterungen

- [ ] JSON Import/Export
- [ ] Equipment-Vorlagen
- [ ] Bulk-Edit (mehrere Items gleichzeitig)
- [ ] Kategorien-Management
- [ ] Bilder für Equipment
- [ ] Verfügbarkeits-Status
- [ ] Historisierung von Änderungen

## 📞 Support

Bei Fragen oder Problemen:

1. Browser-Konsole öffnen (F12)
2. Nach Fehlermeldungen suchen
3. LocalStorage überprüfen: `Application > Local Storage`
4. Ggf. Cache leeren und neu laden

---

**Version:** 1.0.0  
**Letztes Update:** 21. Oktober 2025  
**Autor:** CMMS_ERP Development Team
