# 🎨 Projekt Flow-System - Anleitung

## ✅ Was wurde erstellt

Du hast jetzt ein **visuelles Node-basiertes Projekt-Management-System** wie in Blender!

### 📦 Neue Komponenten

1. **FlowNodes.tsx** - 5 verschiedene Node-Typen:

   - 🟢 **Start Node** - Projekt-Beginn
   - 🔵 **Action Node** - Arbeitsschritte (mit Status, Priorität, Zuweisungen)
   - 🟡 **Decision Node** - Entscheidungspunkte (Ja/Nein)
   - 🟠 **Pause Node** - Wartepunkte
   - 🔴 **End Node** - Projekt-Ende

2. **ProjectFlowEditor.tsx** - Haupt-Editor mit:

   - ✨ Drag & Drop für alle Nodes
   - ✏️ Klick zum Bearbeiten
   - 🎨 Schönes UI mit TailwindCSS
   - 💾 Speichern der Flows
   - 📥 Export als JSON

3. **ProjectFlowView.tsx** - Vollständige Projekt-Ansicht

## 🚀 Schnellstart - Flow System testen

### Option 1: Standalone-Demo erstellen

Erstelle eine Demo-Seite zum Testen:

\`\`\`typescript
// src/pages/FlowDemo.tsx
import React from 'react';
import { ProjectFlowEditor } from '@/components/project-flow/ProjectFlowEditor';
import { Card } from '@/components/ui/card';

export const FlowDemo = () => {
const handleSave = async (nodes, edges) => {
console.log('Gespeichert:', { nodes, edges });
alert('Flow gespeichert! Siehe Console für Details.');
};

return (
<div className="p-6">
<h1 className="text-3xl font-bold mb-6">Projekt Flow Demo</h1>
<Card className="p-6">
<ProjectFlowEditor onSave={handleSave} />
</Card>
</div>
);
};
\`\`\`

Dann in App.tsx hinzufügen:
\`\`\`typescript
import { FlowDemo } from '@/pages/FlowDemo';

// In der Sidebar ein neuer Menüpunkt
{currentPage === "flow-demo" && <FlowDemo />}
\`\`\`

### Option 2: In ProjectList integrieren

Füge einen neuen Tab in ProjectList.tsx hinzu:

\`\`\`typescript
import { ProjectFlowEditor } from '@/components/project-flow/ProjectFlowEditor';
import { Node, Edge } from '@xyflow/react';

// In den Tab-Bereich:
<Tab value="flow">Flow-Diagramm</Tab>

<TabsContent value="flow">
  <ProjectFlowEditor
    projectId={selectedProject?.id}
    initialNodes={/* flow data */}
    initialEdges={/* flow data */}
    onSave={async (nodes, edges) => {
      // Speichern im Backend
      await projectService.updateProject(selectedProject.id, {
        flowData: JSON.stringify({ nodes, edges })
      });
    }}
  />
</TabsContent>
\`\`\`

## 🎮 Bedienung

### Nodes hinzufügen

1. Links in der Toolbar auf einen Node-Typ klicken
2. Node erscheint auf dem Canvas
3. Node an gewünschte Position ziehen

### Nodes verbinden

1. Aus dem **Source-Punkt** (rechts am Node) ziehen
2. Zum **Target-Punkt** (links am Node) ziehen
3. Verbindung wird automatisch animiert

### Nodes bearbeiten

1. Auf einen Node klicken
2. Dialog öffnet sich
3. Titel, Beschreibung, Status, Priorität etc. anpassen
4. Speichern

### Nodes löschen

1. Node anklicken
2. Im Dialog auf "Löschen" klicken

## 💡 Use Cases für deine Präsentation

### Beispiel 1: Pumpen-Wartung

\`\`\`
START → Wartungsplan prüfen → ENTSCHEIDUNG (Teile verfügbar?)
→ JA → Pumpe demontieren → Teile austauschen → Testen → ERFOLG
→ NEIN → Teile bestellen → PAUSE (Lieferzeit) → zurück zu START
\`\`\`

### Beispiel 2: Anlagen-Umbau

\`\`\`
START → Genehmigung einholen → Planung → ENTSCHEIDUNG (Budget OK?)
→ JA → Material beschaffen → Umbau durchführen → Abnahme → ERFOLG
→ NEIN → Budget-Antrag → PAUSE → zurück zu Genehmigung
\`\`\`

## 🎨 Anpassungen

### Node-Farben ändern

In `FlowNodes.tsx`:
\`\`\`typescript
// Beispiel: Action Node andere Farbe

<div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600">
\`\`\`

### Neue Node-Typen hinzufügen

1. In `FlowNodes.tsx` neuen Node erstellen
2. In `nodeTypes` exportieren
3. In Toolbar-Button hinzufügen

### Status-Icons anpassen

In `FlowNodes.tsx` bei `statusIcons`:
\`\`\`typescript
const statusIcons = {
pending: Clock,
active: Wrench,
completed: CheckCircle2,
blocked: AlertCircle,
// Neue hinzufügen:
review: Eye,
};
\`\`\`

## 🔧 Backend Migration

Die Datenbank wurde bereits vorbereitet! Führe die Migration aus:

\`\`\`powershell
cd backend
npx prisma migrate dev --name add_flow_data_to_projects
npx prisma generate
\`\`\`

Das `flowData` Feld speichert den kompletten Flow als JSON.

## 📱 Mobile-Optimierung

Das Flow-System funktioniert auch auf Touch-Geräten:

- Touch & Drag zum Verschieben
- Pinch-to-Zoom
- Touch auf Node zum Bearbeiten

Für 50-jährige Computer-Legastheniker:

- ✅ Große klickbare Buttons
- ✅ Klare Farben und Icons
- ✅ Keine Keyboard-Shortcuts nötig
- ✅ Alles Drag & Drop

## 🎯 Nächste Schritte

1. **Backend Migration ausführen**
2. **Demo-Seite testen**
3. **In ProjectList integrieren**
4. **Beispiel-Flows für Präsentation erstellen**
5. **Screenshots für Dokumentation**

## 🆘 Probleme?

Falls etwas nicht funktioniert:

1. `npm install` erneut ausführen
2. Überprüfen ob `@xyflow/react` installiert ist
3. Browser-Cache leeren (Strg + Shift + Del)

Viel Erfolg mit der Präsentation! 🎉
