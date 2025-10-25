import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Rig {
  name: string;
  category: string;
  maxDepth: number;
  maxHookLoad: number;
  dayRate: string;
  description: string;
}

interface EquipmentItem {
  name: string;
  price: string;
  [key: string]: string;
}

interface QuoteData {
  projectName: string;
  clientName: string;
  location: string;
  projectDuration: string;
  selectedRig: Rig | null;
  selectedEquipment: {
    [category: string]: EquipmentItem[];
  };
  additionalNotes?: string;
}

class RigQuoteExportService {
  /**
   * Generate a professional quote PDF for rig configuration
   */
  generateQuote(quoteData: QuoteData, filename: string = 'rig-quote.pdf') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // ===== HEADER =====
    doc.setFillColor(34, 139, 230);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('MaintAIn CMMS', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Bohranlagen Angebot', pageWidth / 2, 30, { align: 'center' });

    yPosition = 50;

    // ===== QUOTE INFO =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const quoteNumber = `AN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const quoteDate = new Date().toLocaleDateString('de-DE');

    doc.text(`Angebotsnummer: ${quoteNumber}`, 14, yPosition);
    doc.text(`Datum: ${quoteDate}`, pageWidth - 14, yPosition, { align: 'right' });
    yPosition += 10;

    // ===== CLIENT INFO =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Kundeninformationen', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Kunde: ${quoteData.clientName || 'N/A'}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Projekt: ${quoteData.projectName || 'N/A'}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Standort: ${quoteData.location || 'N/A'}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Projektdauer: ${quoteData.projectDuration || 'N/A'}`, 14, yPosition);
    yPosition += 15;

    // ===== SELECTED RIG =====
    if (quoteData.selectedRig) {
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPosition - 5, pageWidth - 28, 8, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 230);
      doc.text('🛢️ Ausgewählte Bohranlage', 18, yPosition);
      yPosition += 12;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(quoteData.selectedRig.name, 18, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Kategorie: ${quoteData.selectedRig.category}`, 18, yPosition);
      yPosition += 5;
      doc.text(`Max. Tiefe: ${quoteData.selectedRig.maxDepth.toLocaleString('de-DE')} m`, 18, yPosition);
      yPosition += 5;
      doc.text(`Max. Hakenlast: ${quoteData.selectedRig.maxHookLoad.toLocaleString('de-DE')} lbs`, 18, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.text(`Tagesrate: € ${quoteData.selectedRig.dayRate}/Tag`, 18, yPosition);
      yPosition += 8;

      if (quoteData.selectedRig.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(quoteData.selectedRig.description, pageWidth - 40);
        doc.text(descLines, 18, yPosition);
        yPosition += descLines.length * 4 + 8;
      }

      yPosition += 5;
    }

    // ===== EQUIPMENT BREAKDOWN =====
    const categoryNames: Record<string, string> = {
      drillPipe: '🔧 Drill Pipes',
      tanks: '💧 Tanks',
      power: '⚡ Power Generation',
      camps: '🏕️ Camps & Accommodation',
      safety: '🛡️ Safety Equipment',
      mud: '🌊 Mud Systems',
      bop: '🔒 BOP Systems',
      cranes: '🏗️ Cranes & Lifting',
      misc: '📦 Miscellaneous',
    };

    let hasEquipment = false;
    let totalEquipmentCost = 0;

    // Check if there's equipment
    Object.values(quoteData.selectedEquipment).forEach(items => {
      if (items.length > 0) hasEquipment = true;
    });

    if (hasEquipment) {
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPosition - 5, pageWidth - 28, 8, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 230);
      doc.text('📋 Zusätzliche Ausrüstung', 18, yPosition);
      yPosition += 10;

      // Equipment table data
      const equipmentTableData: any[] = [];

      Object.entries(quoteData.selectedEquipment).forEach(([category, items]) => {
        if (items.length > 0) {
          items.forEach((item, index) => {
            const price = parseFloat(item.price);
            totalEquipmentCost += price;

            equipmentTableData.push([
              index === 0 ? categoryNames[category] || category : '',
              item.name,
              `€ ${price.toLocaleString('de-DE')}`,
            ]);
          });
        }
      });

      if (equipmentTableData.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Kategorie', 'Beschreibung', 'Tagesrate']],
          body: equipmentTableData,
          theme: 'striped',
          headStyles: {
            fillColor: [34, 139, 230],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 9,
          },
          columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 90 },
            2: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // ===== COST SUMMARY =====
    doc.setFillColor(34, 139, 230);
    doc.rect(14, yPosition - 5, pageWidth - 28, 8, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('💰 Kostenübersicht', 18, yPosition);
    yPosition += 12;

    const rigDailyRate = quoteData.selectedRig
      ? parseFloat(quoteData.selectedRig.dayRate.replace(/[^0-9.-]/g, ''))
      : 0;

    const totalDailyRate = rigDailyRate + totalEquipmentCost;
    
    // Calculate project total if duration is provided
    let projectTotal = 0;
    const durationMatch = quoteData.projectDuration?.match(/(\d+)/);
    if (durationMatch) {
      const days = parseInt(durationMatch[0]);
      projectTotal = totalDailyRate * days;
    }

    const summaryData = [
      ['Bohranlage (Tagesrate)', `€ ${rigDailyRate.toLocaleString('de-DE')}`],
      ['Zusätzliche Ausrüstung (Tagesrate)', `€ ${totalEquipmentCost.toLocaleString('de-DE')}`],
      ['Gesamt Tagesrate', `€ ${totalDailyRate.toLocaleString('de-DE')}`],
    ];

    if (projectTotal > 0) {
      summaryData.push(['', '']);
      summaryData.push([
        `Gesamtpreis (${quoteData.projectDuration})`,
        `€ ${projectTotal.toLocaleString('de-DE')}`,
      ]);
    }

    autoTable(doc, {
      startY: yPosition,
      body: summaryData,
      theme: 'plain',
      bodyStyles: {
        fontSize: 11,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: 'bold' },
        1: { cellWidth: 55, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], fontSize: 12 },
      },
      margin: { left: 18, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // ===== ADDITIONAL NOTES =====
    if (quoteData.additionalNotes && quoteData.additionalNotes.trim() !== '') {
      yPosition += 5;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('📝 Zusätzliche Hinweise', 14, yPosition);
      yPosition += 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const notesLines = doc.splitTextToSize(quoteData.additionalNotes, pageWidth - 28);
      doc.text(notesLines, 14, yPosition);
      yPosition += notesLines.length * 4;
    }

    // ===== TERMS & CONDITIONS =====
    const termsY = doc.internal.pageSize.getHeight() - 50;

    doc.setFillColor(250, 250, 250);
    doc.rect(14, termsY - 5, pageWidth - 28, 35, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Allgemeine Geschäftsbedingungen', 18, termsY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('• Dieses Angebot ist 30 Tage gültig', 18, termsY + 5);
    doc.text('• Preise verstehen sich zzgl. MwSt.', 18, termsY + 10);
    doc.text('• Mobilisierung und Demobilisierung nach Aufwand', 18, termsY + 15);
    doc.text('• Zahlungsbedingungen: 30 Tage netto', 18, termsY + 20);

    // ===== FOOTER =====
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'MaintAIn CMMS | www.maintaIn.com | kontakt@maintaIn.com | +49 (0) 123 456789',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Save
    doc.save(filename);
  }
}

export const rigQuoteExportService = new RigQuoteExportService();
