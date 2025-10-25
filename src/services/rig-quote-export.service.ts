import jsPDF from 'jspdf';

interface Rig {
  name: string;
  category: string;
  maxDepth: number;
  maxHookLoad: number;
  dayRate: string;
  description: string;
  drawworks?: string;
  mudPumps?: string;
  topDrive?: string;
  derrickCapacity?: string;
  crewSize?: string;
  mobilizationTime?: string;
  footprint?: string;
  rotaryTorque?: number;
  pumpPressure?: number;
  applications?: string[];
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
  private addText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return lines.length * 5; // Return height used
  }

  generateQuote(quoteData: QuoteData, filename: string = 'rig-quote.pdf') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 20;

    // ===== PAGE 1: HEADER & INTRODUCTION =====
    
    // Header mit Logo-Bereich
    doc.setFillColor(34, 139, 230);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('MaintAIn', margin, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('CMMS | Professionelle Bohranlagen-Lösungen', margin, 35);
    
    // Angebotsnummer & Datum
    const quoteNumber = `AN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const quoteDate = new Date().toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Angebotsnummer: ${quoteNumber}`, pageWidth - margin, 25, { align: 'right' });
    doc.text(`Datum: ${quoteDate}`, pageWidth - margin, 32, { align: 'right' });

    yPosition = 65;

    // Titel
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`ANGEBOT - ${quoteData.selectedRig?.name.toUpperCase() || 'HOCHLEISTUNGS-BOHRANLAGE'}`, margin, yPosition);
    yPosition += 15;

    // Anrede
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Sehr geehrte Damen und Herren,', margin, yPosition);
    yPosition += 10;

    // Einleitungstext
    const introText = 'vielen Dank für Ihr Interesse an unseren professionellen Bohranlagen-Lösungen. Wir freuen uns, Ihnen folgendes Angebot für eine vollausgestattete Hochleistungs-Bohranlage unterbreiten zu dürfen:';
    yPosition += this.addText(doc, introText, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;

    // Kunde & Projekt Info
    if (quoteData.clientName || quoteData.projectName) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJEKT-INFORMATIONEN:', margin, yPosition);
      yPosition += 7;
      
      doc.setFont('helvetica', 'normal');
      if (quoteData.clientName) {
        doc.text(`Kunde: ${quoteData.clientName}`, margin + 5, yPosition);
        yPosition += 6;
      }
      if (quoteData.projectName) {
        doc.text(`Projekt: ${quoteData.projectName}`, margin + 5, yPosition);
        yPosition += 6;
      }
      if (quoteData.location) {
        doc.text(`Standort: ${quoteData.location}`, margin + 5, yPosition);
        yPosition += 6;
      }
      if (quoteData.projectDuration) {
        doc.text(`Projektdauer: ${quoteData.projectDuration}`, margin + 5, yPosition);
        yPosition += 6;
      }
      yPosition += 8;
    }

    if (!quoteData.selectedRig) {
      doc.save(filename);
      return;
    }

    const rig = quoteData.selectedRig;

    // ===== ANGEBOTENE AUSRÜSTUNG =====
    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 10, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 230);
    doc.text('ANGEBOTENE AUSRÜSTUNG', margin, yPosition);
    yPosition += 12;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Bohranlage: ${rig.name}`, margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    yPosition += this.addText(doc, rig.description || 'Hochleistungs-Bohranlage für anspruchsvolle Projekte', margin, yPosition, pageWidth - 2 * margin);
    yPosition += 12;

    // Force new page after introduction - keep page 1 clean
    doc.addPage();
    yPosition = margin;

    // ===== TECHNISCHE SPEZIFIKATIONEN =====
    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 10, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 230);
    doc.text('TECHNISCHE SPEZIFIKATIONEN', margin, yPosition);
    yPosition += 12;

    // Bohrkapazität & Leistung
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Bohrkapazität & Leistung:', margin + 5, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const specs1 = [
      `• Maximale Bohrtiefe: ${rig.maxDepth.toLocaleString('de-DE')} m`,
      `• Hakenlast: ${rig.maxHookLoad.toLocaleString('de-DE')} t`,
      rig.rotaryTorque ? `• Drehmoment: ${rig.rotaryTorque.toLocaleString('de-DE')} Nm` : null,
      rig.pumpPressure ? `• Pumpendruck: ${rig.pumpPressure.toLocaleString('de-DE')} psi` : null,
    ].filter(Boolean);

    specs1.forEach(spec => {
      if (spec) {
        doc.text(spec, margin + 10, yPosition);
        yPosition += 7;
      }
    });
    yPosition += 6;

    // Antriebssysteme
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Antriebssysteme:', margin + 5, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const specs2 = [
      rig.drawworks ? `• Drawworks: ${rig.drawworks}` : null,
      rig.mudPumps ? `• Mud Pumps: ${rig.mudPumps}` : null,
      rig.topDrive ? `• Top Drive: ${rig.topDrive}` : null,
    ].filter(Boolean);

    specs2.forEach(spec => {
      if (spec) {
        doc.text(spec, margin + 10, yPosition);
        yPosition += 7;
      }
    });
    yPosition += 6;

    // Crew & Mobilisierung
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Crew & Mobilisierung:', margin + 5, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const specs3 = [
      rig.crewSize ? `• Crew-Größe: ${rig.crewSize}` : null,
      rig.mobilizationTime ? `• Mobilisierungszeit: ${rig.mobilizationTime}` : null,
      rig.footprint ? `• Platzbedarf: ${rig.footprint}` : null,
    ].filter(Boolean);

    specs3.forEach(spec => {
      if (spec) {
        doc.text(spec, margin + 10, yPosition);
        yPosition += 7;
      }
    });
    yPosition += 6;

    // Einsatzgebiete
    if (rig.applications && rig.applications.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Einsatzgebiete:', margin + 5, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      rig.applications.forEach(app => {
        doc.text(`• ${app}`, margin + 10, yPosition);
        yPosition += 7;
      });
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = margin;
    } else {
      yPosition += 10;
    }

    // ===== QUALITÄTS- UND WARTUNGSSTANDARDS =====
    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 230);
    doc.text('QUALITÄTS- UND WARTUNGSSTANDARDS:', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const qualityText1 = 'Sämtliche Komponenten der Bohranlage entsprechen den aktuellen API-Standards (American Petroleum Institute) und wurden gemäß den strengen Industrienormen zertifiziert. Die Anlage wird kontinuierlich durch MaintAIn ordnungsgemäß gewartet und befindet sich in einwandfreiem technischen Zustand.';
    yPosition += this.addText(doc, qualityText1, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 8;

    const qualityText2 = 'Alle Sicherheitssysteme sind auf dem neuesten Stand und entsprechen den internationalen Sicherheitsvorschriften für Bohroperationen. Die Anlage wurde kürzlich einer vollständigen Inspektion unterzogen und ist sofort einsatzbereit.';
    yPosition += this.addText(doc, qualityText2, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;

    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    // ===== LEISTUNGSUMFANG =====
    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 230);
    doc.text('LEISTUNGSUMFANG:', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const services = [
      `Komplette Bohranlage ${rig.name} inkl. aller Hauptkomponenten`,
      'Vollständige technische Dokumentation',
      'API-konforme Ausrüstung mit aktuellen Zertifikaten',
      'Regelmäßige Wartung durch MaintAIn-System',
      `Qualifiziertes und erfahrenes Bohrteam${rig.crewSize ? ' (' + rig.crewSize + ')' : ''}`,
      'Mobilisierung und Demobilisierung der Anlage',
      '24/7 technischer Support während der Laufzeit',
    ];

    services.forEach(service => {
      doc.text(`• ${service}`, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 5;

    // Check if we need a new page before pricing
    if (yPosition > pageHeight - 120) {
      doc.addPage();
      yPosition = margin;
    } else {
      yPosition += 10;
    }

    // ===== PREISGESTALTUNG =====
    doc.setFillColor(34, 139, 230);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PREISGESTALTUNG:', margin, yPosition);
    yPosition += 12;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    const dayRate = parseFloat(rig.dayRate.replace(/[^0-9.-]/g, ''));
    const formattedDayRate = new Intl.NumberFormat('de-DE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(dayRate);
    doc.text(`Tagesrate Bohranlage ${rig.name}: € ${formattedDayRate}`, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const priceText = 'Die angegebene Tagesrate beinhaltet die komplette Anlage mit allen technischen Systemen, das Bohrteam sowie die laufende Wartung und Instandhaltung durch unser Fachpersonal.';
    yPosition += this.addText(doc, priceText, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;

    // Equipment costs if any
    let totalEquipmentCost = 0;
    const hasEquipment = Object.values(quoteData.selectedEquipment).some(items => items.length > 0);

    if (hasEquipment) {
      Object.values(quoteData.selectedEquipment).forEach(items => {
        items.forEach(item => {
          totalEquipmentCost += parseFloat(item.price);
        });
      });

      const formattedEquipmentCost = new Intl.NumberFormat('de-DE', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).format(totalEquipmentCost);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`Zusatzausrüstung (Tagesrate): € ${formattedEquipmentCost}`, margin, yPosition);
      yPosition += 8;

      const totalDailyRate = dayRate + totalEquipmentCost;
      const formattedTotalDailyRate = new Intl.NumberFormat('de-DE', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).format(totalDailyRate);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`GESAMT TAGESRATE: € ${formattedTotalDailyRate}`, margin, yPosition);
      yPosition += 10;
    }

    // Total project cost if duration specified
    if (quoteData.projectDuration) {
      const durationMatch = quoteData.projectDuration.match(/(\d+)/);
      if (durationMatch) {
        const days = parseInt(durationMatch[0]);
        const totalRate = dayRate + totalEquipmentCost;
        const projectTotal = totalRate * days;
        
        const formattedProjectTotal = new Intl.NumberFormat('de-DE', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        }).format(projectTotal);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 139, 230);
        doc.text(`Gesamtpreis (${quoteData.projectDuration}): € ${formattedProjectTotal}`, margin, yPosition);
        yPosition += 12;
      }
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = margin;
    } else {
      yPosition += 5;
    }

    // ===== VERFÜGBARKEIT & VERTRAGSBEDINGUNGEN =====
    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 230);
    doc.text('VERFÜGBARKEIT & VERTRAGSBEDINGUNGEN:', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const mobilTime = rig.mobilizationTime || '30-45 Tage';
    const availabilityText = `Die Bohranlage kann nach erfolgreicher Mobilisierung (${mobilTime}) am gewünschten Standort eingesetzt werden. Die Mindestvertragslaufzeit sowie spezifische Vertragsbedingungen werden in einem gesonderten Rahmenvertrag festgelegt.`;
    yPosition += this.addText(doc, availabilityText, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;

    // ===== ZUSÄTZLICHE LEISTUNGEN =====
    if (hasEquipment) {
      doc.setFillColor(240, 240, 240);
      doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 10, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 230);
      doc.text('ZUSÄTZLICHE AUSRÜSTUNG:', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      Object.entries(quoteData.selectedEquipment).forEach(([, items]) => {
        if (items.length > 0) {
          items.forEach(item => {
            const price = parseFloat(item.price);
            const formattedPrice = new Intl.NumberFormat('de-DE', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 0 
            }).format(price);
            doc.text(`• ${item.name}: € ${formattedPrice}/Tag`, margin + 5, yPosition);
            yPosition += 6;
          });
        }
      });
      yPosition += 5;
    }

    const additionalText = 'Auf Wunsch können weitere Zusatzausrüstungen wie Bohrgestänge, Tanks & Silos sowie spezialisierte Bohrwerkzeuge konfiguriert werden. Gerne erstellen wir Ihnen ein individuelles Angebot basierend auf Ihren spezifischen Projektanforderungen.';
    yPosition += this.addText(doc, additionalText, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;

    // Check if we need a new page for benefits
    if (yPosition > pageHeight - 110) {
      doc.addPage();
      yPosition = margin;
    } else {
      yPosition += 8;
    }

    // ===== IHRE VORTEILE =====
    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 230);
    doc.text('IHRE VORTEILE:', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const benefits = [
      'Modernste Bohrtechnologie für extreme Anforderungen',
      'API-zertifizierte und kontinuierlich gewartete Ausrüstung',
      'Erfahrenes und qualifiziertes Bohrteam',
      'Lückenlose Dokumentation und Qualitätssicherung',
      'Flexible Vertragsbedingungen',
      'Umfassender technischer Support',
    ];

    benefits.forEach(benefit => {
      doc.text(`✓ ${benefit}`, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 8;

    // Check if we need a new page for closing
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    } else {
      yPosition += 5;
    }

    // ===== ABSCHLUSSTEXT =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const closingText = 'Wir stehen Ihnen für Rückfragen jederzeit gerne zur Verfügung und freuen uns auf eine erfolgreiche Zusammenarbeit.';
    yPosition += this.addText(doc, closingText, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 15;

    doc.setFont('helvetica', 'italic');
    doc.text('Mit freundlichen Grüßen', margin, yPosition);
    yPosition += 6;
    doc.text('Ihr MaintAIn Team', margin, yPosition);

    // ===== FOOTER (auf jeder Seite) =====
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Trennlinie
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      // Footer Text
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('MaintAIn CMMS | Professionelle Bohranlagen-Lösungen', margin, pageHeight - 18);
      doc.text('www.maintaIn.com | kontakt@maintaIn.com | +49 (0) 123 456789', margin, pageHeight - 13);
      
      // Seitenzahl
      doc.text(`Seite ${i} von ${totalPages}`, pageWidth - margin, pageHeight - 18, { align: 'right' });
      doc.text(`Angebot ${quoteNumber}`, pageWidth - margin, pageHeight - 13, { align: 'right' });
    }

    doc.save(filename);
  }
}

export const rigQuoteExportService = new RigQuoteExportService();
