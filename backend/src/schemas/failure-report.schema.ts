import { z } from 'zod';

const VALID_PLANTS = ['T208', 'T207', 'T700', 'T46'] as const;

// ── Failure Reports ───────────────────────────────────────

export const createFailureReportSchema = z.object({
  plant: z.enum(VALID_PLANTS, { errorMap: () => ({ message: 'Ungültige Anlage' }) }),
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  location: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  photoFilename: z.string().optional(),
  photoPath: z.string().optional(),
});

export const updateFailureReportSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  location: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.string().optional(),
});

export const convertToActionSchema = z.object({
  assignedTo: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
});
