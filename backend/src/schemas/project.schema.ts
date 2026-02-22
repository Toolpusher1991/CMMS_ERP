import { z } from 'zod';

// ── Projects ──────────────────────────────────────────────

export const createProjectSchema = z.object({
  projectNumber: z.string().min(1, 'Projektnummer ist erforderlich'),
  name: z.string().min(1, 'Projektname ist erforderlich'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  totalBudget: z.number().min(0).optional(),
  spentBudget: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  managerId: z.string().optional(),
  plant: z.string().optional(),
  category: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema
  .omit({ projectNumber: true })
  .partial()
  .extend({
    projectNumber: z.string().min(1).optional(),
    flowData: z.any().optional(),
  });

// ── Tasks ─────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Aufgabentitel ist erforderlich'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completedAt: z.string().nullable().optional(),
});

// ── Project Files ─────────────────────────────────────────

export const createProjectFileSchema = z.object({
  filename: z.string().min(1, 'Dateiname ist erforderlich'),
  originalName: z.string().min(1, 'Originaldateiname ist erforderlich'),
  fileType: z.string().min(1, 'Dateityp ist erforderlich'),
  fileSize: z.number().int().positive(),
  filePath: z.string().min(1, 'Dateipfad ist erforderlich'),
  uploadedBy: z.string().min(1, 'uploadedBy ist erforderlich'),
});
