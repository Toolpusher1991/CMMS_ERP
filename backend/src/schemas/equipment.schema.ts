import { z } from 'zod';

// ── Equipment ─────────────────────────────────────────────

export const createEquipmentSchema = z.object({
  category: z.string().min(1, 'Kategorie ist erforderlich'),
  name: z.string().min(1, 'Name ist erforderlich'),
  price: z.string().min(1, 'Preis ist erforderlich'),
  properties: z.record(z.unknown()).optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();
