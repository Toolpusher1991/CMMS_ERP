import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Action } from './action.service';
import type { FailureReport } from './failure-report.service';

interface Project {
  id: string;
  name: string;
  plant: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
}

class PDFExportService {
  /**
   * Export Actions to PDF
   */
  exportActions(actions: Action[], filename: string = 'actions-export.pdf') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(34, 139, 230);
    doc.text('MaintAIn CMMS - Action Tracker Report', pageWidth / 2, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, 28, { align: 'center' });

    // Summary Statistics
    const stats = {
      total: actions.length,
      open: actions.filter(a => a.status === 'OPEN').length,
      inProgress: actions.filter(a => a.status === 'IN_PROGRESS').length,
      completed: actions.filter(a => a.status === 'COMPLETED').length,
      urgent: actions.filter(a => a.priority === 'URGENT').length,
    };

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Zusammenfassung:', 14, 40);

    const summaryData = [
      ['Gesamt Actions', stats.total.toString()],
      ['Offen', stats.open.toString()],
      ['In Bearbeitung', stats.inProgress.toString()],
      ['Abgeschlossen', stats.completed.toString()],
      ['Dringend (URGENT)', stats.urgent.toString()],
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Metrik', 'Anzahl']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [34, 139, 230] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    });

    // Actions Table
    const tableData = actions.map((action, index) => [
      (index + 1).toString(),
      action.plant,
      action.title,
      this.translateStatus(action.status),
      this.translatePriority(action.priority),
      action.assignedToName || action.assignedTo || '-',
      action.dueDate ? new Date(action.dueDate).toLocaleDateString('de-DE') : '-',
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Nr.', 'Anlage', 'Titel', 'Status', 'Priorität', 'Zugewiesen', 'Fällig']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 230], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 60 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Seite ${currentPage} von ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
    });

    // Save
    doc.save(filename);
  }

  /**
   * Export Failure Reports to PDF
   */
  exportFailureReports(reports: FailureReport[], filename: string = 'failure-reports-export.pdf') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(168, 85, 247);
    doc.text('MaintAIn CMMS - Störungsmeldungen Report', pageWidth / 2, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    const stats = {
      total: reports.length,
      reported: reports.filter(r => r.status === 'REPORTED').length,
      converted: reports.filter(r => r.status === 'CONVERTED_TO_ACTION').length,
      resolved: reports.filter(r => r.status === 'RESOLVED').length,
      critical: reports.filter(r => r.severity === 'CRITICAL').length,
    };

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Zusammenfassung:', 14, 40);

    const summaryData = [
      ['Gesamt Störungen', stats.total.toString()],
      ['Neu gemeldet', stats.reported.toString()],
      ['Zu Actions konvertiert', stats.converted.toString()],
      ['Gelöst', stats.resolved.toString()],
      ['Kritisch (CRITICAL)', stats.critical.toString()],
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Metrik', 'Anzahl']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [168, 85, 247] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    });

    // Reports Table
    const tableData = reports.map((report, index) => [
      (index + 1).toString(),
      report.plant,
      report.title,
      this.translateFailureStatus(report.status),
      this.translateSeverity(report.severity),
      report.reportedByName || '-',
      new Date(report.createdAt).toLocaleDateString('de-DE'),
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Nr.', 'Anlage', 'Titel', 'Status', 'Schwere', 'Gemeldet von', 'Datum']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 65 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 20 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Seite ${currentPage} von ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
    });

    // Save
    doc.save(filename);
  }

  /**
   * Export Projects to PDF
   */
  exportProjects(projects: Project[], filename: string = 'projects-export.pdf') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(34, 139, 230);
    doc.text('MaintAIn CMMS - Projekt Report', pageWidth / 2, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'Aktiv').length,
      completed: projects.filter(p => p.status === 'Abgeschlossen').length,
      planned: projects.filter(p => p.status === 'Geplant').length,
      totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    };

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Zusammenfassung:', 14, 40);

    const summaryData = [
      ['Gesamt Projekte', stats.total.toString()],
      ['Aktiv', stats.active.toString()],
      ['Abgeschlossen', stats.completed.toString()],
      ['Geplant', stats.planned.toString()],
      ['Gesamt Budget', `€ ${stats.totalBudget.toLocaleString('de-DE')}`],
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Metrik', 'Wert']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [34, 139, 230] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    });

    // Projects Table
    const tableData = projects.map((project, index) => [
      (index + 1).toString(),
      project.plant,
      project.name,
      project.status,
      `€ ${project.budget.toLocaleString('de-DE')}`,
      `${project.progress}%`,
      new Date(project.startDate).toLocaleDateString('de-DE'),
      new Date(project.endDate).toLocaleDateString('de-DE'),
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Nr.', 'Anlage', 'Projektname', 'Status', 'Budget', 'Fortschritt', 'Start', 'Ende']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 230], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 18 },
        2: { cellWidth: 55 },
        3: { cellWidth: 22 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Seite ${currentPage} von ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
    });

    // Save
    doc.save(filename);
  }

  /**
   * Export Dashboard Summary to PDF
   */
  exportDashboardSummary(
    actions: Action[],
    reports: FailureReport[],
    filename: string = 'dashboard-summary.pdf'
  ) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(34, 139, 230);
    doc.text('MaintAIn CMMS', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text('Dashboard Zusammenfassung', pageWidth / 2, 28, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, 35, { align: 'center' });

    // Action Tracker Stats
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('📋 Action Tracker', 14, 50);

    const actionStats = [
      ['Gesamt Actions', actions.length.toString()],
      ['Offen', actions.filter(a => a.status === 'OPEN').length.toString()],
      ['In Bearbeitung', actions.filter(a => a.status === 'IN_PROGRESS').length.toString()],
      ['Abgeschlossen', actions.filter(a => a.status === 'COMPLETED').length.toString()],
      ['Dringend (URGENT)', actions.filter(a => a.priority === 'URGENT').length.toString()],
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Metrik', 'Anzahl']],
      body: actionStats,
      theme: 'striped',
      headStyles: { fillColor: [34, 139, 230] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    });

    // Failure Reports Stats
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('🚨 Störungsmeldungen', 14, (doc as any).lastAutoTable.finalY + 15);

    const reportStats = [
      ['Gesamt Störungen', reports.length.toString()],
      ['Neu gemeldet', reports.filter(r => r.status === 'REPORTED').length.toString()],
      ['Zu Actions konvertiert', reports.filter(r => r.status === 'CONVERTED_TO_ACTION').length.toString()],
      ['Kritisch (CRITICAL)', reports.filter(r => r.severity === 'CRITICAL').length.toString()],
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Metrik', 'Anzahl']],
      body: reportStats,
      theme: 'striped',
      headStyles: { fillColor: [168, 85, 247] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    });

    // Plant Breakdown
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('🏭 Anlagen-Übersicht', 14, (doc as any).lastAutoTable.finalY + 15);

    const plants = ['T208', 'T207', 'T700', 'T46'];
    const plantData = plants.map(plant => [
      plant,
      actions.filter(a => a.plant === plant).length.toString(),
      reports.filter(r => r.plant === plant).length.toString(),
      actions.filter(a => a.plant === plant && a.status === 'OPEN').length.toString(),
      actions.filter(a => a.plant === plant && a.priority === 'URGENT').length.toString(),
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Anlage', 'Actions', 'Störungen', 'Offen', 'Dringend']],
      body: plantData,
      theme: 'grid',
      headStyles: { fillColor: [34, 139, 230] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Seite 1 von ${pageCount} | MaintAIn CMMS v1.2`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Save
    doc.save(filename);
  }

  // Helper functions
  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      OPEN: 'Offen',
      IN_PROGRESS: 'In Bearbeitung',
      COMPLETED: 'Abgeschlossen',
    };
    return statusMap[status] || status;
  }

  private translatePriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      LOW: 'Niedrig',
      MEDIUM: 'Mittel',
      HIGH: 'Hoch',
      URGENT: 'Dringend',
    };
    return priorityMap[priority] || priority;
  }

  private translateFailureStatus(status: string): string {
    const statusMap: Record<string, string> = {
      REPORTED: 'Gemeldet',
      IN_REVIEW: 'In Prüfung',
      CONVERTED_TO_ACTION: '→ Action',
      RESOLVED: 'Gelöst',
    };
    return statusMap[status] || status;
  }

  private translateSeverity(severity: string): string {
    const severityMap: Record<string, string> = {
      LOW: 'Niedrig',
      MEDIUM: 'Mittel',
      HIGH: 'Hoch',
      CRITICAL: 'Kritisch',
    };
    return severityMap[severity] || severity;
  }
}

export const pdfExportService = new PDFExportService();
