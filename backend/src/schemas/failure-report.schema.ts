import { z } from 'zod';

// ── Failure Reports ───────────────────────────────────────

export const createFailureReportSchema = z.object({
  plant: z.string().min(1, 'Anlage ist erforderlich'),
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
