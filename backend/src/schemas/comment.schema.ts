import { z } from 'zod';

// ── Comments ──────────────────────────────────────────────

export const commentSchema = z.object({
  text: z.string().min(1, 'Kommentartext ist erforderlich').transform((t) => t.trim()),
});
