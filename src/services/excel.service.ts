import * as XLSX from 'xlsx';

interface Action {
  id: string;
  plant: string;
  location?: string;
  category?: string;
  discipline?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  createdBy?: string;
  createdAt: string;
}

/**
 * Export Actions to Excel file
 */
export const exportActionsToExcel = (actions: Action[], filename = 'actions.xlsx') => {
  // Prepare data for Excel
  const excelData = actions.map(action => ({
    'ID': action.id,
    'Anlage': action.plant,
    'Standort': action.location || '',
    'Kategorie': action.category || 'ALLGEMEIN',
    'Fachbereich': action.discipline || '',
    'Titel': action.title,
    'Beschreibung': action.description || '',
    'Status': action.status,
    'Priorität': action.priority,
    'Zugewiesen an': action.assignedTo || '',
    'Fälligkeitsdatum': action.dueDate ? new Date(action.dueDate).toLocaleDateString('de-DE') : '',
    'Abgeschlossen am': action.completedAt ? new Date(action.completedAt).toLocaleDateString('de-DE') : '',
    'Erstellt von': action.createdBy || '',
    'Erstellt am': new Date(action.createdAt).toLocaleDateString('de-DE'),
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Actions');

  // Set column widths
  const colWidths = [
    { wch: 10 }, // ID
    { wch: 8 },  // Anlage
    { wch: 15 }, // Standort
    { wch: 12 }, // Kategorie
    { wch: 15 }, // Fachbereich
    { wch: 30 }, // Titel
    { wch: 50 }, // Beschreibung
    { wch: 12 }, // Status
    { wch: 10 }, // Priorität
    { wch: 20 }, // Zugewiesen an
    { wch: 15 }, // Fälligkeitsdatum
    { wch: 15 }, // Abgeschlossen am
    { wch: 20 }, // Erstellt von
    { wch: 15 }, // Erstellt am
  ];
  worksheet['!cols'] = colWidths;

  // Generate Excel file and download
  XLSX.writeFile(workbook, filename);
};

/**
 * Import Actions from Excel file
 */
export const importActionsFromExcel = (file: File): Promise<Partial<Action>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel rows to Action objects
        const actions: Partial<Action>[] = jsonData.map((row: any) => {
          // Parse dates
          const parseDueDate = (dateStr: string) => {
            if (!dateStr) return undefined;
            const parts = dateStr.split('.');
            if (parts.length === 3) {
              return new Date(
                parseInt(parts[2], 10),
                parseInt(parts[1], 10) - 1,
                parseInt(parts[0], 10)
              ).toISOString();
            }
            return undefined;
          };

          return {
            id: row['ID'] || undefined, // Keep ID if updating existing action
            plant: row['Anlage'] || 'T208',
            location: row['Standort'] || undefined,
            category: row['Kategorie'] || 'ALLGEMEIN',
            discipline: row['Fachbereich'] || undefined,
            title: row['Titel'] || 'Ohne Titel',
            description: row['Beschreibung'] || '',
            status: row['Status'] || 'OPEN',
            priority: row['Priorität'] || 'MEDIUM',
            assignedTo: row['Zugewiesen an'] || undefined,
            dueDate: parseDueDate(row['Fälligkeitsdatum']),
          };
        });

        resolve(actions);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Create Excel template for Actions
 */
export const downloadActionTemplate = () => {
  const templateData = [
    {
      'ID': '(leer lassen für neue Actions)',
      'Anlage': 'T208',
      'Standort': 'TD',
      'Kategorie': 'ALLGEMEIN',
      'Fachbereich': 'MECHANIK',
      'Titel': 'Beispiel Action',
      'Beschreibung': 'Detaillierte Beschreibung',
      'Status': 'OPEN',
      'Priorität': 'MEDIUM',
      'Zugewiesen an': 'user@example.com',
      'Fälligkeitsdatum': '31.12.2025',
      'Abgeschlossen am': '',
      'Erstellt von': '',
      'Erstellt am': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Actions Template');

  // Set column widths
  const colWidths = [
    { wch: 35 }, // ID
    { wch: 8 },  // Anlage
    { wch: 15 }, // Standort
    { wch: 12 }, // Kategorie
    { wch: 15 }, // Fachbereich
    { wch: 30 }, // Titel
    { wch: 50 }, // Beschreibung
    { wch: 12 }, // Status
    { wch: 10 }, // Priorität
    { wch: 20 }, // Zugewiesen an
    { wch: 15 }, // Fälligkeitsdatum
    { wch: 15 }, // Abgeschlossen am
    { wch: 20 }, // Erstellt von
    { wch: 15 }, // Erstellt am
  ];
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, 'action_template.xlsx');
};
