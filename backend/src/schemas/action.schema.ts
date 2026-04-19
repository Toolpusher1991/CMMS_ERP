import { z } from 'zod';

// ── Actions ───────────────────────────────────────────────

export const createActionSchema = z.object({
  plant: z.string().min(1, 'Anlage ist erforderlich'),
  location: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  discipline: z.string().nullable().optional(),
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  assignedUsers: z.array(z.string()).optional(),
  dueDate: z.string().nullable().optional(),
});

export const updateActionSchema = createActionSchema.partial();

// ── Status Request ────────────────────────────────────────

export const statusRequestSchema = z.object({
  involvedUsers: z.array(z.string().min(1)).min(1, 'Mindestens ein Benutzer erforderlich'),
  message: z.string().min(1, 'Nachricht ist erforderlich'),
});
