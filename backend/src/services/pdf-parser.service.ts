interface ParsedInspectionItem {
  itemNumber: string;
  description: string;
  itemType: 'CHECKBOX' | 'MEASUREMENT' | 'TEXT';
  minValue?: string;
  maxValue?: string;
  measurementUnit?: string;
}

interface ParsedInspectionSection {
  sectionNumber: number;
  title: string;
  description?: string;
  items: ParsedInspectionItem[];
}

interface ParsedInspectionReport {
  title: string;
  type: string;
  sections: ParsedInspectionSection[];
}

export class PDFParserService {
  /**
   * Parse PDF buffer and extract inspection checklist items
   */
  async parsePDF(pdfBuffer: Buffer): Promise<ParsedInspectionReport> {
    try {
      // pdf-parse v1.1.1 is a simple function export
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(pdfBuffer);
      const text = data.text;

      // Extract title from first line or use default
      const lines = text.split('\n').filter((line: string) => line.trim());
      const title = this.extractTitle(lines);
      const type = this.extractType(lines);

      // Parse sections and items
      const sections = this.extractSections(text);

      return {
        title,
        type,
        sections,
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF');
    }
  }

  /**
   * Extract title from PDF text
   */
  private extractTitle(lines: string[]): string {
    // Look for common title patterns
    for (const line of lines.slice(0, 10)) {
      if (
        line.includes('INSPECTION') ||
        line.includes('CHECKLIST') ||
        line.includes('REPORT') ||
        line.includes('SILO') ||
        line.includes('JOB')
      ) {
        return line.trim();
      }
    }
    return lines[0]?.trim() || 'Inspection Report';
  }

  /**
   * Extract inspection type from title
   */
  private extractType(lines: string[]): string {
    const titleText = lines.slice(0, 5).join(' ').toUpperCase();
    
    if (titleText.includes('SILO')) return 'SILO';
    if (titleText.includes('CROWN') || titleText.includes('BLOCK')) return 'CAT3-CROWN-BLOCK';
    if (titleText.includes('HOIST')) return 'HOIST';
    if (titleText.includes('CRANE')) return 'CRANE';
    
    return 'GENERAL';
  }

  /**
   * Extract sections and items from PDF text
   */
  private extractSections(text: string): ParsedInspectionSection[] {
    const sections: ParsedInspectionSection[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    let currentSection: ParsedInspectionSection | null = null;
    let itemCounter = 1;
    let sectionCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and very short lines
      if (!line || line.length < 3) continue;

      // Detect section headers (all caps, or numbered sections)
      if (this.isSectionHeader(line)) {
        // Save previous section
        if (currentSection && currentSection.items.length > 0) {
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          sectionNumber: sectionCounter++,
          title: this.cleanSectionTitle(line),
          description: '',
          items: [],
        };
        itemCounter = 1;
        continue;
      }

      // Detect checklist items
      if (this.isChecklistItem(line)) {
        if (!currentSection) {
          // Create default section if none exists
          currentSection = {
            sectionNumber: sectionCounter++,
            title: 'General Inspection',
            items: [],
          };
        }

        const item = this.parseChecklistItem(line, itemCounter);
        if (item) {
          currentSection.items.push(item);
          itemCounter++;
        }
      }
    }

    // Add last section
    if (currentSection && currentSection.items.length > 0) {
      sections.push(currentSection);
    }

    // If no sections were found, create a single section with all items
    if (sections.length === 0) {
      const items = this.extractAllItems(lines);
      if (items.length > 0) {
        sections.push({
          sectionNumber: 1,
          title: 'Inspection Items',
          items,
        });
      }
    }

    return sections;
  }

  /**
   * Check if line is a section header
   */
  private isSectionHeader(line: string): boolean {
    // All uppercase with minimum length
    if (line === line.toUpperCase() && line.length > 5 && line.length < 100) {
      // Avoid false positives
      if (!line.includes('YES') && !line.includes('NO') && !line.includes('N/A')) {
        return true;
      }
    }

    // Numbered sections like "1. GENERAL INFORMATION"
    if (/^\d+\.\s+[A-Z]/.test(line)) {
      return true;
    }

    return false;
  }

  /**
   * Clean section title
   */
  private cleanSectionTitle(line: string): string {
    // Remove leading numbers
    return line.replace(/^\d+\.\s*/, '').trim();
  }

  /**
   * Check if line is a checklist item
   */
  private isChecklistItem(line: string): boolean {
    // Has checkbox indicators
    if (line.includes('☐') || line.includes('□') || line.includes('▢')) {
      return true;
    }

    // Has bullet points or dashes
    if (/^[-•●○]\s+/.test(line)) {
      return true;
    }

    // Numbered items
    if (/^\d+[.)]\s+/.test(line)) {
      return true;
    }

    // Questions or inspection points
    if (
      line.includes('?') ||
      line.toLowerCase().includes('check') ||
      line.toLowerCase().includes('inspect') ||
      line.toLowerCase().includes('verify') ||
      line.toLowerCase().includes('ensure')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Parse a checklist item line
   */
  private parseChecklistItem(line: string, itemNumber: number): ParsedInspectionItem | null {
    // Clean the line
    const description = line
      .replace(/[☐□▢]/g, '')
      .replace(/^[-•●○]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .trim();

    if (!description || description.length < 5) {
      return null;
    }

    // Determine item type
    let itemType: 'CHECKBOX' | 'MEASUREMENT' | 'TEXT' = 'CHECKBOX';
    let measurementUnit: string | undefined;
    let minValue: string | undefined;
    let maxValue: string | undefined;

    // Check for measurement indicators
    const measurementPatterns = [
      /(\d+\.?\d*)\s*(mm|cm|m|km|in|ft|kg|lbs|bar|psi|°C|°F)/i,
      /(pressure|temperature|weight|length|height|width|depth|diameter)/i,
    ];

    for (const pattern of measurementPatterns) {
      if (pattern.test(description)) {
        itemType = 'MEASUREMENT';
        
        // Extract unit
        const unitMatch = description.match(/\b(mm|cm|m|km|in|ft|kg|lbs|bar|psi|°C|°F)\b/i);
        if (unitMatch) {
          measurementUnit = unitMatch[1];
        }
        
        // Extract ranges
        const rangeMatch = description.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
        if (rangeMatch) {
          minValue = rangeMatch[1];
          maxValue = rangeMatch[2];
        }
        break;
      }
    }

    // Check for text/comment items
    if (
      description.toLowerCase().includes('comment') ||
      description.toLowerCase().includes('note') ||
      description.toLowerCase().includes('remarks') ||
      description.toLowerCase().includes('observation')
    ) {
      itemType = 'TEXT';
    }

    return {
      itemNumber: itemNumber.toString(),
      description,
      itemType,
      minValue,
      maxValue,
      measurementUnit,
    };
  }

  /**
   * Extract all potential checklist items from lines
   */
  private extractAllItems(lines: string[]): ParsedInspectionItem[] {
    const items: ParsedInspectionItem[] = [];
    let itemCounter = 1;

    for (const line of lines) {
      if (this.isChecklistItem(line)) {
        const item = this.parseChecklistItem(line, itemCounter);
        if (item) {
          items.push(item);
          itemCounter++;
        }
      }
    }

    return items;
  }
}

export const pdfParserService = new PDFParserService();
