import { z } from 'zod';

// ── Chatbot ───────────────────────────────────────────────

export const chatSchema = z.object({
  message: z.string().min(1, 'Nachricht ist erforderlich'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional(),
});
