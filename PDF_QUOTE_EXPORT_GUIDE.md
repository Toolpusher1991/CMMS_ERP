# 📄 PDF Quote Export - Anleitung

## ✅ Implementiert am: 25.10.2025

Der **Rig Configurator** hat jetzt einen professionellen PDF-Export für Kundenangebote!

---

## 🎯 Was wurde implementiert?

### **PDF-Export Service**
- `rig-quote-export.service.ts` - Spezialisierter Service für Bohranlagen-Angebote
- Professionelles Layout mit MaintAIn Branding
- Automatische Preis-Kalkulation
- Deutsche Formatierung (Datum, Währung)

---

## 🚀 So funktioniert es

### **1. Rig Configurator öffnen**
```
Navigation → Bohranlagen (Tender Icon)
```

### **2. Projekt-Details eingeben**
- Tab: **"Anforderungen"**
- Pflichtfelder:
  - Kundenname
  - Projektname
  - Standort
  - Projektdauer (z.B. "30 Tage")
  - Zusätzliche Hinweise (optional)

### **3. Bohranlage auswählen**
- Tab: **"Anlagen"**
- Anlage aus der Liste auswählen
- Automatisch gefiltert nach Anforderungen

### **4. Equipment hinzufügen** (optional)
- Tab: **"Equipment"**
- Kategorien:
  - 🔧 Drill Pipes
  - 💧 Tanks
  - ⚡ Power Generation
  - 🏕️ Camps
  - 🛡️ Safety Equipment
  - etc.

### **5. Zusammenfassung & Export**
- Tab: **"Zusammenfassung"**
- Button: **"Angebot als PDF erstellen"** 🟢
- PDF wird automatisch heruntergeladen

---

## 📋 PDF-Inhalt

### **Header**
- MaintAIn CMMS Branding (blau)
- Titel: "Bohranlagen Angebot"
- Angebotsnummer: `AN-2025-XXXX`
- Datum

### **Kundeninformationen**
- Kunde
- Projekt
- Standort
- Projektdauer

### **Ausgewählte Bohranlage** 🛢️
- Name & Kategorie
- Technische Specs (Max. Tiefe, Hakenlast)
- **Tagesrate** (grün hervorgehoben)
- Beschreibung

### **Zusätzliche Ausrüstung** 📋
- Tabelle mit allen ausgewählten Equipment-Items
- Gruppiert nach Kategorien
- Einzelpreise pro Item
- Gesamt Equipment-Kosten

### **Kostenübersicht** 💰
```
Bohranlage (Tagesrate)              € 50,000
Zusätzliche Ausrüstung (Tagesrate)  € 12,500
─────────────────────────────────────────────
Gesamt Tagesrate                    € 62,500

Gesamtpreis (30 Tage)               € 1,875,000
```

### **Zusätzliche Hinweise** 📝
- Freitext aus Projektanforderungen

### **Geschäftsbedingungen**
- Gültigkeit: 30 Tage
- Preise zzgl. MwSt.
- Mobilisierung nach Aufwand
- Zahlungsbedingungen: 30 Tage netto

### **Footer**
- MaintAIn Kontaktdaten
- Website, Email, Telefon

---

## 🎨 Design-Features

### **Farb-Coding**
- 🔵 Blau: MaintAIn Header
- 🟢 Grün: Preise & Kostenübersicht
- ⚪ Grau: Hintergründe & Sektionen

### **Schriftarten**
- **Helvetica Bold**: Überschriften
- **Helvetica Normal**: Fließtext
- **Größen**: 28px (Titel) → 8px (Footer)

### **Layout**
- A4 Format (jsPDF Standard)
- Professionelle Abstände
- Tabellen mit Zebra-Streifen
- Automatische Seitenumbrüche

---

## 💡 Beispiel-Workflow

```typescript
// 1. Kunde: "Öl & Gas GmbH"
// 2. Projekt: "Nordseebohrung 2025"
// 3. Standort: "Nordsee, Block 15/21"
// 4. Dauer: "45 Tage"

// 5. Rig: "Viking 5000 Deep Water Rig"
//    Tagesrate: € 85,000

// 6. Equipment:
//    - 5" Drill Pipes (500 m): € 5,000
//    - Mud Tank (1000 bbl): € 3,500
//    - BOP System: € 15,000

// 7. Export → PDF wird generiert:
//    "Angebot-Öl & Gas GmbH-2025-10-25.pdf"

// Kostenübersicht:
//    Tagesrate: € 108,500
//    Gesamtpreis (45 Tage): € 4,882,500
```

---

## 🔧 Technische Details

### **Dependencies**
```json
{
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.3"
}
```

### **Service Location**
```
src/services/rig-quote-export.service.ts
```

### **Integration**
```typescript
// RigConfigurator.tsx
import { rigQuoteExportService } from "@/services/rig-quote-export.service";

const exportConfiguration = () => {
  rigQuoteExportService.generateQuote({
    projectName: requirements.projectName,
    clientName: requirements.clientName,
    location: requirements.location,
    projectDuration: requirements.projectDuration,
    selectedRig: selectedRig,
    selectedEquipment: selectedEquipment,
    additionalNotes: requirements.additionalNotes,
  }, filename);
};
```

### **Dateiname-Format**
```
Angebot-[Kundenname]-[YYYY-MM-DD].pdf

Beispiel: Angebot-Shell-2025-10-25.pdf
```

---

## 📊 Features

✅ **Automatische Berechnung**
- Tagesrate = Rig + Equipment
- Gesamtpreis = Tagesrate × Projektdauer

✅ **Mehrsprachig-Ready**
- Deutsche Texte
- Währung: EUR (€)
- Datumsformat: TT.MM.JJJJ

✅ **Professionell**
- Corporate Design
- Strukturierte Sektionen
- Klare Preis-Darstellung

✅ **Vollständig**
- Alle relevanten Infos
- Rechtliche Hinweise
- Kontaktdaten

---

## 🎯 Zukünftige Erweiterungen (Optional)

### **Email-Versand**
```typescript
// Angebot direkt per Email an Kunde senden
emailService.sendQuote(pdfBlob, customerEmail);
```

### **Versionen**
```typescript
// Mehrere Angebots-Varianten vergleichen
const versions = [
  { name: "Standard", equipment: [/* ... */] },
  { name: "Premium", equipment: [/* ... */] },
];
```

### **Templates**
```typescript
// Verschiedene Brandings
pdfExportService.generateQuote(data, {
  template: "maintaIn" | "clientBranded" | "minimal"
});
```

### **Mehrsprachig**
```typescript
// Deutsch, Englisch, Französisch
pdfExportService.generateQuote(data, {
  language: "de" | "en" | "fr"
});
```

---

## ✅ Fertigstellung

**Status:** 🟢 Production Ready  
**Getestet:** ✅ Ja  
**Dokumentiert:** ✅ Ja  
**Deployed:** 🚀 Bereit

---

**Erstellt:** 25.10.2025  
**Feature-Branch:** `feat/pdf-quote-export`  
**Commit:** `a303e6f`
