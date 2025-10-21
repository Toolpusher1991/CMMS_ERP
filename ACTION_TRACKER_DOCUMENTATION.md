# 📋 Action Tracker - Dokumentation

## ✅ Erfolgreich implementiert am: 20.10.2025

---

## 🎯 Übersicht

Der **Action Tracker** ist eine neue Seite zur Verwaltung von Aufgaben, ToDos und offenen Jobs für alle 4 Anlagen des CMMS/ERP Systems.

### **Features:**

- ✅ **4 Anlagen-Tabs**: T208, T207, T700, T46
- ✅ **3 Kategorien**: Elektrik ⚡, Mechanik 🔧, Anlage 🏭
- ✅ **Task-basiertes UI**: Checkbox-System zum Statuswechsel
- ✅ **Prioritätssystem**: LOW, MEDIUM, HIGH, URGENT
- ✅ **Status-Tracking**: OPEN → IN_PROGRESS → COMPLETED
- ✅ **Statistik-Dashboard**: Gesamt, Offen, In Arbeit, Erledigt, Dringend
- ✅ **Fälligkeitsdaten**: Mit visueller Warnung bei Überschreitung
- ✅ **Zuweisungen**: Mitarbeiter können zugewiesen werden
- ✅ **Responsive Design**: 3-Spalten-Layout (Desktop), gestapelt (Mobile)

---

## 🚀 Navigation

**Neue Navigation in der Hauptmenü-Leiste:**

```
Projekte | Work Orders | Action Tracker | Benutzerverwaltung (ADMIN)
```

Der Action Tracker ist für **alle Benutzer** zugänglich (nicht nur ADMIN).

---

## 📊 Seitenstruktur

### **1. Header-Bereich**

- Titel: "Action Tracker"
- Beschreibung
- Button: "Neue Aktion" → Öffnet Dialog

### **2. Anlagen-Tabs**

Horizontale Tab-Leiste mit 4 Tabs:

- **T208** (mit Urgent-Badge falls vorhanden)
- **T207**
- **T700**
- **T46**

### **3. Statistik-Dashboard** (pro Anlage)

5 Karten mit Metriken:

- **Gesamt**: Alle Aktionen
- **Offen**: Status = OPEN
- **In Arbeit**: Status = IN_PROGRESS
- **Erledigt**: Status = COMPLETED
- **Dringend**: Priority = URGENT (rot hervorgehoben)

### **4. Kategorien-Spalten** (3 Spalten)

Jede Spalte zeigt Aktionen einer Kategorie:

#### **Elektrik ⚡**

- Icon: Blitz-Symbol
- Farbe: Blau/Gelb (elektrisch)
- Beispiele: Hauptschalter, Kabelzug, Schaltschrank

#### **Mechanik 🔧**

- Icon: Schraubenschlüssel
- Farbe: Grau/Orange
- Beispiele: Pumpe warten, Lager schmieren, Ventile

#### **Anlage 🏭**

- Icon: Fabrik-Symbol
- Farbe: Neutral
- Beispiele: Transport Liste, Inspektion, Anlage allgemein

---

## 🎨 Action Card Design

Jede Action Card enthält:

```
┌─────────────────────────────────────────────┐
│ ○ Titel der Aktion              [PRIORITY]  │
│   Beschreibung der Aktion...                │
│                                              │
│   ⚡ Kategorie  👤 Mitarbeiter  🕐 Datum    │
│                                          🗑️ │
└─────────────────────────────────────────────┘
```

### **Status-Icons:**

- ⭕ **Circle** (leer) = OPEN
- 🔵 **Clock** (blau) = IN_PROGRESS
- ✅ **CheckCircle** (grün) = COMPLETED

### **Prioritäts-Badges:**

- 🔴 **URGENT**: Rot
- 🟠 **HIGH**: Orange
- 🟡 **MEDIUM**: Gelb
- 🔵 **LOW**: Blau

### **Interaktionen:**

- **Status ändern**: Klick auf Status-Icon
  - OPEN → IN_PROGRESS → COMPLETED → OPEN (Cycle)
- **Löschen**: Hover über Card → Papierkorb-Icon erscheint
- **Fälligkeitsdatum**: Wird ROT wenn überschritten

---

## 💡 Verwendungsbeispiele

### **Beispiel 1: Elektrik-Aufgabe erstellen**

1. Klick auf "Neue Aktion"
2. Wähle Anlage: **T700**
3. Titel: **"Hauptschalter überprüfen"**
4. Beschreibung: **"Zustand prüfen und dokumentieren"**
5. Kategorie: **Elektrik**
6. Priorität: **HIGH**
7. Zugewiesen an: **"Max Mustermann"**
8. Fälligkeitsdatum: **25.10.2025**
9. Klick "Erstellen"

**Ergebnis:**

- Aktion erscheint in **T700-Tab** → **Elektrik-Spalte**
- Status: OPEN (leerer Kreis)
- Badge: Orange (HIGH)

### **Beispiel 2: Transport Liste (TP-INSP)**

1. Klick auf "Neue Aktion"
2. Wähle Anlage: **T208**
3. Titel: **"Transport Liste - Ventile"**
4. Beschreibung: **"Ventile für Inspektion vorbereiten und Transport organisieren"**
5. Kategorie: **Anlage**
6. Priorität: **URGENT**
7. Zugewiesen an: **"Thomas Müller"**
8. Fälligkeitsdatum: **22.10.2025**
9. Klick "Erstellen"

**Ergebnis:**

- Aktion erscheint in **T208-Tab** → **Anlage-Spalte**
- Status: OPEN
- Badge: Rot (URGENT)
- Tab zeigt Urgent-Badge mit Anzahl

### **Beispiel 3: Mechanik-Wartung**

1. Klick auf "Neue Aktion"
2. Wähle Anlage: **T46**
3. Titel: **"Pumpe warten"**
4. Beschreibung: **"Routinewartung der Hauptpumpe durchführen"**
5. Kategorie: **Mechanik**
6. Priorität: **MEDIUM**
7. Zugewiesen an: **"Anna Schmidt"**
8. Fälligkeitsdatum: **23.10.2025**
9. Klick "Erstellen"

**Ergebnis:**

- Aktion in **T46-Tab** → **Mechanik-Spalte**
- Status: OPEN
- Badge: Gelb (MEDIUM)

---

## 🔄 Workflow-Beispiel

### **Kompletter Lifecycle einer Aktion:**

```
1. ERSTELLEN
   → Neue Aktion erstellen
   → Status: OPEN (⭕)

2. STARTEN
   → Klick auf Status-Icon
   → Status: IN_PROGRESS (🔵)
   → Aktion wird blau

3. ABSCHLIESSEN
   → Klick auf Status-Icon
   → Status: COMPLETED (✅)
   → Aktion wird transparent
   → "Erledigt am" Datum erscheint

4. (OPTIONAL) REAKTIVIEREN
   → Klick auf Status-Icon
   → Status: OPEN (zurück zu Schritt 1)
```

---

## 📈 Statistik-Bedeutung

### **Für Anlage T208 mit 5 Aktionen:**

```
┌─────────┬────────┬───────────┬──────────┬──────────┐
│ Gesamt  │ Offen  │ In Arbeit │ Erledigt │ Dringend │
│   5     │   2    │     2     │    1     │    1     │
└─────────┴────────┴───────────┴──────────┴──────────┘
```

**Interpretation:**

- 5 Aktionen total für diese Anlage
- 2 noch nicht begonnen
- 2 werden gerade bearbeitet
- 1 ist fertig
- 1 hat URGENT-Priorität (Achtung!)

---

## 🎯 Anwendungsfälle

### **Use Case 1: Tägliche Wartungsaufgaben**

**Szenario:** Schichtleiter erstellt morgens alle Wartungsaufgaben

1. Wechsle zu entsprechender Anlage (z.B. T700)
2. Erstelle Aktionen für jede Kategorie:
   - Elektrik: "Schaltschrank prüfen"
   - Mechanik: "Lager nachfetten"
   - Anlage: "Sichtprüfung durchführen"
3. Weise Mitarbeitern zu
4. Setze Fälligkeit auf heute

**Ergebnis:** Übersicht aller ToDos für den Tag

### **Use Case 2: TP-INSP Transport Management**

**Szenario:** Teile müssen zur Inspektion transportiert werden

1. Gehe zu entsprechender Anlage
2. Erstelle Aktion:
   - Kategorie: **Anlage**
   - Titel: "Transport Liste - [Teile]"
   - Priorität: Nach Dringlichkeit
3. In Beschreibung: Details der zu transportierenden Teile
4. Status-Tracking beim Transport

**Ergebnis:** Nachverfolgbare Transport-Aufgaben

### **Use Case 3: Offene Jobs aus Work Orders**

**Szenario:** Work Order enthält mehrere Einzelaufgaben

1. Aus Work Order Seite kommend
2. Für jede Teilaufgabe eigene Action erstellen
3. Kategorie zuweisen (Elektrik/Mechanik/Anlage)
4. Verschiedene Personen zuweisen
5. Status einzeln tracken

**Ergebnis:** Granulare Verfolgung von Teilaufgaben

---

## 🛠️ Technische Details

### **Datenstruktur:**

```typescript
interface Action {
  id: string;
  title: string;
  description: string;
  category: "Elektrik" | "Mechanik" | "Anlage";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
  anlage: "T208" | "T207" | "T700" | "T46";
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}
```

### **State Management:**

```typescript
const [actions, setActions] = useState<Action[]>([]);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [selectedAnlage, setSelectedAnlage] = useState<Anlage>("T208");
const [formData, setFormData] = useState({...});
```

### **Wichtige Funktionen:**

```typescript
// Aktionen nach Anlage filtern
getActionsByAnlage(anlage: Anlage): Action[]

// Aktionen nach Anlage + Kategorie filtern
getActionsByCategory(anlage: Anlage, category: Category): Action[]

// Statistiken berechnen
getStats(anlage: Anlage): Statistics

// Neue Aktion erstellen
handleCreateAction(): void

// Status wechseln (OPEN → IN_PROGRESS → COMPLETED)
toggleActionStatus(id: string): void

// Aktion löschen
handleDeleteAction(id: string): void
```

---

## 🎨 Design-Features

### **Responsive Breakpoints:**

- **Desktop (>768px)**: 3 Spalten nebeneinander
- **Tablet/Mobile (<768px)**: Spalten gestapelt

### **Dark Mode Support:**

- ✅ Alle Farben passen sich an Theme an
- ✅ Prioritäts-Badges bleiben gut sichtbar
- ✅ Icons mit passender Opacity

### **Hover-Effekte:**

- Status-Icon vergrößert sich beim Hover
- Löschen-Button erscheint beim Hover über Card
- Smooth Transitions überall

### **Visuelle Hinweise:**

- **Überfällig**: Rotes Datum
- **Dringend**: Roter Badge auf Tab
- **Erledigt**: 60% Opacity
- **In Arbeit**: Blaue Farbe

---

## 📝 Zukünftige Erweiterungen (Optional)

### **Phase 1: Backend-Integration**

- [ ] Actions in Datenbank speichern
- [ ] API-Endpunkte für CRUD
- [ ] Persistente Speicherung

### **Phase 2: Erweiterte Features**

- [ ] Kommentare zu Actions
- [ ] Dateien anhängen
- [ ] History/Changelog
- [ ] Export zu Excel

### **Phase 3: Automatisierung**

- [ ] Actions aus Work Orders generieren
- [ ] Benachrichtigungen bei Fälligkeit
- [ ] Automatische Zuweisung
- [ ] Recurring Tasks

---

## ✅ Zusammenfassung

**Was wurde erstellt:**

- ✅ Neue Seite: `ActionTracker.tsx` (729 Zeilen)
- ✅ Integration in `App.tsx`
- ✅ Navigation erweitert
- ✅ Demo-Daten für alle Anlagen

**Key Features:**

- 4 Anlagen-Tabs mit Statistiken
- 3 Kategorien-Spalten (Elektrik, Mechanik, Anlage)
- Task-basiertes UI mit Checkboxen
- Prioritäten und Status-Tracking
- Fälligkeitsdaten mit Warnungen
- Vollständig responsives Design
- Dark Mode Support

**Zugriff:**

1. Anmelden unter http://localhost:5173
2. Klick auf **"Action Tracker"** in Navigation
3. Tab auswählen (T208, T207, T700, T46)
4. Actions anzeigen, erstellen, bearbeiten

---

**Erstellt:** 20.10.2025  
**Version:** 1.0  
**Status:** ✅ Ready to Use  
**Datei:** `src/pages/ActionTracker.tsx`
