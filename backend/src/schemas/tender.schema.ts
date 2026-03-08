import { z } from 'zod';

// ── Tender Configurations ─────────────────────────────────

export const createTenderSchema = z.object({
  projectName: z.string().min(1, 'Projektname ist erforderlich'),
  clientName: z.string().optional(),
  location: z.string().optional(),
  projectDuration: z.string().optional(),
  selectedRig: z.unknown(),   // JSON blob – validated in controller
  selectedEquipment: z.unknown().optional(),
  totalPrice: z.number({ required_error: 'Gesamtpreis ist erforderlich' }),
  isUnderContract: z.boolean().optional(),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
  technicalRisks: z.unknown().optional(),
  commercialNotes: z.unknown().optional(),
});

export const updateTenderSchema = createTenderSchema.partial();
