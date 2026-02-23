import { z } from 'zod';

// ── Actions ───────────────────────────────────────────────

export const createActionSchema = z.object({
  plant: z.string().min(1, 'Anlage ist erforderlich'),
  location: z.string().optional(),
  category: z.string().optional(),
  discipline: z.string().optional(),
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

export const updateActionSchema = createActionSchema.partial();

// ── Status Request ────────────────────────────────────────

export const statusRequestSchema = z.object({
  involvedUsers: z.array(z.string().min(1)).min(1, 'Mindestens ein Benutzer erforderlich'),
  message: z.string().min(1, 'Nachricht ist erforderlich'),
});
