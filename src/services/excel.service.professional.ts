import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

// Color scheme matching the app
const COLORS = {
  primary: '3B82F6', // Blue
  secondary: '06B6D4', // Cyan
  success: '10B981', // Green
  warning: 'F59E0B', // Yellow/Orange
  danger: 'EF4444', // Red
  gray: '6B7280',
  lightGray: 'F3F4F6',
  white: 'FFFFFF',
  // Status colors
  statusOpen: 'FCD34D', // Yellow
  statusInProgress: '3B82F6', // Blue
  statusCompleted: '10B981', // Green
  // Priority colors
  priorityLow: '10B981', // Green
  priorityMedium: 'F59E0B', // Yellow
  priorityHigh: 'F97316', // Orange
  priorityUrgent: 'EF4444', // Red
};

/**
 * Professional Excel Export with Charts, Filters, and Styling
 */
export const exportActionsToExcelProfessional = async (
  actions: Action[],
  filename = 'MaintAIn_Actions_Export.xlsx'
) => {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'MaintAIn CMMS';
  workbook.lastModifiedBy = 'MaintAIn CMMS';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Create Dashboard Sheet
  const dashboardSheet = workbook.addWorksheet('Dashboard', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }]
  });
  
  // Create Actions Data Sheet
  const dataSheet = workbook.addWorksheet('Actions', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }]
  });

  // =====================================================
  // DASHBOARD SHEET
  // =====================================================
  await createDashboard(dashboardSheet, actions);

  // =====================================================
  // ACTIONS DATA SHEET
  // =====================================================
  await createActionsSheet(dataSheet, actions);

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename);
};

/**
 * Create Dashboard Sheet with KPIs and Charts
 */
async function createDashboard(sheet: ExcelJS.Worksheet, actions: Action[]) {
  // Calculate statistics
  const stats = {
    total: actions.length,
    open: actions.filter(a => a.status === 'OPEN').length,
    inProgress: actions.filter(a => a.status === 'IN_PROGRESS').length,
    completed: actions.filter(a => a.status === 'COMPLETED').length,
    urgent: actions.filter(a => a.priority === 'URGENT').length,
    high: actions.filter(a => a.priority === 'HIGH').length,
    medium: actions.filter(a => a.priority === 'MEDIUM').length,
    low: actions.filter(a => a.priority === 'LOW').length,
  };

  // === HEADER ===
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '📊 MaintAIn - Action Tracker Dashboard';
  titleCell.font = { size: 20, bold: true, color: { argb: COLORS.white } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.primary },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 40;

  // Subtitle
  sheet.mergeCells('A2:H2');
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.value = `Exportiert am: ${new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
  subtitleCell.font = { size: 11, color: { argb: COLORS.gray } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(2).height = 25;

  // Empty row
  sheet.getRow(3).height = 10;

  // === KPI CARDS ===
  const kpiRow = 4;
  
  // Total Actions
  createKpiCard(sheet, 'A4:B5', '📋 Gesamt', stats.total, COLORS.primary);
  
  // Open Actions
  createKpiCard(sheet, 'C4:D5', '🟡 Offen', stats.open, COLORS.statusOpen);
  
  // In Progress Actions
  createKpiCard(sheet, 'E4:F5', '🔵 In Bearbeitung', stats.inProgress, COLORS.statusInProgress);
  
  // Completed Actions
  createKpiCard(sheet, 'G4:H5', '✅ Abgeschlossen', stats.completed, COLORS.statusCompleted);

  // === CHARTS DATA ===
  const chartDataRow = 7;
  
  // Status Distribution Table
  sheet.getCell('A7').value = 'Status Verteilung';
  sheet.getCell('A7').font = { bold: true, size: 12 };
  sheet.getCell('A8').value = 'Status';
  sheet.getCell('B8').value = 'Anzahl';
  sheet.getCell('A8').font = { bold: true };
  sheet.getCell('B8').font = { bold: true };
  
  sheet.getCell('A9').value = 'Offen';
  sheet.getCell('B9').value = stats.open;
  sheet.getCell('A10').value = 'In Bearbeitung';
  sheet.getCell('B10').value = stats.inProgress;
  sheet.getCell('A11').value = 'Abgeschlossen';
  sheet.getCell('B11').value = stats.completed;

  // Priority Distribution Table
  sheet.getCell('D7').value = 'Prioritäten Verteilung';
  sheet.getCell('D7').font = { bold: true, size: 12 };
  sheet.getCell('D8').value = 'Priorität';
  sheet.getCell('E8').value = 'Anzahl';
  sheet.getCell('D8').font = { bold: true };
  sheet.getCell('E8').font = { bold: true };
  
  sheet.getCell('D9').value = 'Niedrig';
  sheet.getCell('E9').value = stats.low;
  sheet.getCell('D10').value = 'Mittel';
  sheet.getCell('E10').value = stats.medium;
  sheet.getCell('D11').value = 'Hoch';
  sheet.getCell('E11').value = stats.high;
  sheet.getCell('D12').value = 'Dringend';
  sheet.getCell('E12').value = stats.urgent;

  // Location Breakdown
  const locationStats = new Map<string, number>();
  actions.forEach(action => {
    const loc = action.location || 'Nicht angegeben';
    locationStats.set(loc, (locationStats.get(loc) || 0) + 1);
  });

  sheet.getCell('G7').value = '📍 Nach Standort';
  sheet.getCell('G7').font = { bold: true, size: 12 };
  sheet.getCell('G8').value = 'Standort';
  sheet.getCell('H8').value = 'Anzahl';
  sheet.getCell('G8').font = { bold: true };
  sheet.getCell('H8').font = { bold: true };

  let locRow = 9;
  locationStats.forEach((count, location) => {
    sheet.getCell(`G${locRow}`).value = location;
    sheet.getCell(`H${locRow}`).value = count;
    locRow++;
  });

  // Set column widths
  sheet.getColumn('A').width = 20;
  sheet.getColumn('B').width = 12;
  sheet.getColumn('C').width = 3;
  sheet.getColumn('D').width = 20;
  sheet.getColumn('E').width = 12;
  sheet.getColumn('F').width = 3;
  sheet.getColumn('G').width = 20;
  sheet.getColumn('H').width = 12;
}

/**
 * Create KPI Card
 */
function createKpiCard(
  sheet: ExcelJS.Worksheet,
  range: string,
  title: string,
  value: number,
  color: string
) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(':')[0]);
  cell.value = `${title}\n${value}`;
  cell.font = { size: 14, bold: true, color: { argb: COLORS.white } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: color },
  };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  
  // Set row height
  const rowNum = parseInt(range.split(':')[0].replace(/[A-Z]/g, ''));
  sheet.getRow(rowNum).height = 30;
  sheet.getRow(rowNum + 1).height = 30;
}

/**
 * Create Actions Data Sheet with Styling and Filters
 */
async function createActionsSheet(sheet: ExcelJS.Worksheet, actions: Action[]) {
  // === HEADER ===
  sheet.mergeCells('A1:N1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '📋 MaintAIn - Action Tracker Export';
  titleCell.font = { size: 18, bold: true, color: { argb: COLORS.white } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.primary },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 35;

  // Subtitle
  sheet.mergeCells('A2:N2');
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.value = `${actions.length} Actions | Exportiert am ${new Date().toLocaleDateString('de-DE')}`;
  subtitleCell.font = { size: 11, color: { argb: COLORS.gray } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(2).height = 20;

  // === TABLE HEADER ===
  const headerRow = sheet.getRow(3);
  const headers = [
    'Nr.',
    'ID',
    'Anlage',
    '📍 Standort',
    'Kategorie',
    'Fachbereich',
    'Titel',
    'Beschreibung',
    'Status',
    'Priorität',
    'Zugewiesen an',
    'Fälligkeitsdatum',
    'Abgeschlossen am',
    'Erstellt von',
  ];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLORS.white }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.primary },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 25;

  // === DATA ROWS ===
  actions.forEach((action, index) => {
    const row = sheet.getRow(4 + index);
    const rowNum = 4 + index;
    
    // Check if overdue
    const isOverdue = action.dueDate && 
      action.status !== 'COMPLETED' && 
      new Date(action.dueDate) < new Date();

    const cells = [
      index + 1, // Nr.
      action.id,
      action.plant,
      action.location || '-',
      action.category || 'ALLGEMEIN',
      action.discipline || '-',
      action.title,
      action.description || '-',
      action.status,
      action.priority,
      action.assignedTo || '-',
      action.dueDate ? new Date(action.dueDate).toLocaleDateString('de-DE') : '-',
      action.completedAt ? new Date(action.completedAt).toLocaleDateString('de-DE') : '-',
      action.createdBy || '-',
    ];

    cells.forEach((value, cellIndex) => {
      const cell = row.getCell(cellIndex + 1);
      cell.value = value;
      
      // Zebra striping
      if (index % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.lightGray },
        };
      }

      // Status coloring
      if (cellIndex === 8) { // Status column
        let statusColor = COLORS.white;
        if (action.status === 'OPEN') statusColor = COLORS.statusOpen;
        else if (action.status === 'IN_PROGRESS') statusColor = COLORS.statusInProgress;
        else if (action.status === 'COMPLETED') statusColor = COLORS.statusCompleted;
        
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: statusColor },
        };
        cell.font = { bold: true, color: { argb: COLORS.white } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Priority coloring
      if (cellIndex === 9) { // Priority column
        let priorityColor = COLORS.white;
        if (action.priority === 'LOW') priorityColor = COLORS.priorityLow;
        else if (action.priority === 'MEDIUM') priorityColor = COLORS.priorityMedium;
        else if (action.priority === 'HIGH') priorityColor = COLORS.priorityHigh;
        else if (action.priority === 'URGENT') priorityColor = COLORS.priorityUrgent;
        
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: priorityColor },
        };
        cell.font = { bold: true, color: { argb: COLORS.white } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Overdue date coloring
      if (cellIndex === 11 && isOverdue) { // Due date column
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEBEE' }, // Light red
        };
        cell.font = { bold: true, color: { argb: COLORS.danger } };
      }

      // Borders for all cells
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E7EB' } },
        left: { style: 'thin', color: { argb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        right: { style: 'thin', color: { argb: 'E5E7EB' } },
      };

      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    row.height = 20;
  });

  // === AUTO-FILTER ===
  sheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3 + actions.length, column: headers.length },
  };

  // === COLUMN WIDTHS ===
  sheet.getColumn(1).width = 6;   // Nr.
  sheet.getColumn(2).width = 15;  // ID
  sheet.getColumn(3).width = 10;  // Anlage
  sheet.getColumn(4).width = 15;  // Standort
  sheet.getColumn(5).width = 12;  // Kategorie
  sheet.getColumn(6).width = 12;  // Fachbereich
  sheet.getColumn(7).width = 30;  // Titel
  sheet.getColumn(8).width = 40;  // Beschreibung
  sheet.getColumn(9).width = 15;  // Status
  sheet.getColumn(10).width = 12; // Priorität
  sheet.getColumn(11).width = 20; // Zugewiesen
  sheet.getColumn(12).width = 15; // Fälligkeitsdatum
  sheet.getColumn(13).width = 15; // Abgeschlossen
  sheet.getColumn(14).width = 20; // Erstellt von
}

/**
 * Export Actions Template for Import
 */
export const downloadActionTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Actions Template');

  // Header
  sheet.mergeCells('A1:N1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '📋 MaintAIn - Action Import Template';
  titleCell.font = { size: 18, bold: true, color: { argb: COLORS.white } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.primary },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 35;

  // Instructions
  sheet.mergeCells('A2:N2');
  const instructionCell = sheet.getCell('A2');
  instructionCell.value = 'Füllen Sie die Felder aus und importieren Sie die Datei. Pflichtfelder: Anlage, Titel';
  instructionCell.font = { size: 10, italic: true };
  instructionCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Table header
  const headerRow = sheet.getRow(3);
  const headers = [
    'ID (leer für neu)',
    'Anlage *',
    'Standort',
    'Kategorie',
    'Fachbereich',
    'Titel *',
    'Beschreibung',
    'Status',
    'Priorität',
    'Zugewiesen an',
    'Fälligkeitsdatum',
    'Abgeschlossen am',
    'Erstellt von',
    'Erstellt am',
  ];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.primary },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Data validation for dropdowns
  // Anlage dropdown
  sheet.dataValidations.add('B4:B1000', {
    type: 'list',
    allowBlank: false,
    formulae: ['"T208,T207,T700,T46"'],
    showErrorMessage: true,
    errorTitle: 'Ungültige Anlage',
    error: 'Bitte wählen Sie eine gültige Anlage aus',
  });

  // Status dropdown
  sheet.dataValidations.add('H4:H1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"OPEN,IN_PROGRESS,COMPLETED"'],
  });

  // Priority dropdown
  sheet.dataValidations.add('I4:I1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"LOW,MEDIUM,HIGH,URGENT"'],
  });

  // Category dropdown
  sheet.dataValidations.add('D4:D1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"ALLGEMEIN,RIGMOVE"'],
  });

  // Discipline dropdown
  sheet.dataValidations.add('E4:E1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"MECHANIK,ELEKTRIK,ANLAGE"'],
  });

  // Column widths
  sheet.columns.forEach((column, index) => {
    column.width = index === 6 || index === 7 ? 40 : 15;
  });

  // Example row
  const exampleRow = sheet.getRow(4);
  exampleRow.values = [
    '', // ID
    'T208', // Anlage
    'TD', // Standort
    'ALLGEMEIN', // Kategorie
    'MECHANIK', // Fachbereich
    'Beispiel Action', // Titel
    'Detaillierte Beschreibung', // Beschreibung
    'OPEN', // Status
    'MEDIUM', // Priorität
    'user@example.com', // Zugewiesen
    '31.12.2025', // Fälligkeitsdatum
    '', // Abgeschlossen
    'admin@example.com', // Erstellt von
    new Date().toLocaleDateString('de-DE'), // Erstellt am
  ];

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, 'MaintAIn_Actions_Import_Template.xlsx');
};
