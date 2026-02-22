import { z } from 'zod';

// ── Rigs (Configurator) ──────────────────────────────────

export const createRigSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  category: z.string().min(1, 'Kategorie ist erforderlich'),
  maxDepth: z.union([z.string(), z.number()]).transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v)),
  maxHookLoad: z.union([z.string(), z.number()]).transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v)),
  footprint: z.string().optional(),
  rotaryTorque: z.union([z.string(), z.number()]).transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v)).optional(),
  pumpPressure: z.union([z.string(), z.number()]).transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v)).optional(),
  drawworks: z.string().optional(),
  mudPumps: z.string().optional(),
  topDrive: z.string().optional(),
  derrickCapacity: z.string().optional(),
  crewSize: z.string().optional(),
  mobilizationTime: z.string().optional(),
  dayRate: z.string().optional(),
  description: z.string().optional(),
  applications: z.array(z.string()).optional(),
  technicalSpecs: z.string().optional(),
});

export const updateRigSchema = createRigSchema.partial();
