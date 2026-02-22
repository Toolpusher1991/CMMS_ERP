import { z } from 'zod';

// ── Inspection Reports ────────────────────────────────────

const inspectionItemSchema = z.object({
  itemNumber: z.number().optional(),
  description: z.string().optional(),
  isChecked: z.boolean().optional(),
  measurementValue: z.string().optional(),
  textValue: z.string().optional(),
  rating: z.string().optional(),
  result: z.string().optional(),
  notes: z.string().optional(),
});

const inspectionSectionSchema = z.object({
  sectionNumber: z.number().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  items: z.array(inspectionItemSchema).optional(),
});

export const parsePDFSchema = z.object({
  plant: z.string().min(1, 'Anlage ist erforderlich'),
  equipment: z.string().min(1, 'Equipment ist erforderlich'),
  inspector: z.string().optional(),
  inspectionDate: z.string().optional(),
});

export const createInspectionReportSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  type: z.string().min(1, 'Typ ist erforderlich'),
  plant: z.string().min(1, 'Anlage ist erforderlich'),
  equipment: z.string().min(1, 'Equipment ist erforderlich'),
  inspectionDate: z.string().min(1, 'Inspektionsdatum ist erforderlich'),
  inspector: z.string().optional(),
  sections: z.array(inspectionSectionSchema).optional(),
});

export const updateInspectionReportSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.string().optional(),
  overallResult: z.string().optional(),
  generalNotes: z.string().optional(),
  recommendations: z.string().optional(),
  inspectorSignature: z.string().optional(),
  supervisorSignature: z.string().optional(),
});

export const updateInspectionItemSchema = z.object({
  isChecked: z.boolean().optional(),
  measurementValue: z.string().optional(),
  textValue: z.string().optional(),
  rating: z.string().optional(),
  result: z.string().optional(),
  notes: z.string().optional(),
});
