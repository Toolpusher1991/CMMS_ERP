import { z } from 'zod';

// ── Asset Integrity Rigs ──────────────────────────────────

export const createAssetRigSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  region: z.string().min(1, 'Region ist erforderlich'),
  contractStatus: z.enum(['stacked', 'operational', 'overhaul']).optional(),
  location: z.string().optional(),
  operator: z.string().optional(),
  dayRate: z.union([z.string(), z.number()]).optional(),
  contractEndDate: z.string().optional(),
  certifications: z.array(z.unknown()).optional(),
});

export const updateAssetRigSchema = z.object({
  region: z.string().optional(),
  contractStatus: z.enum(['stacked', 'operational', 'overhaul']).optional(),
  location: z.string().optional(),
  operator: z.string().nullable().optional(),
  dayRate: z.union([z.string(), z.number()]).optional(),
  contractEndDate: z.string().nullable().optional(),
  certifications: z.array(z.unknown()).optional(),
  generalInfo: z.array(z.unknown()).optional(),
  inspections: z.array(z.unknown()).optional(),
  issues: z.array(z.unknown()).optional(),
  improvements: z.array(z.unknown()).optional(),
});
