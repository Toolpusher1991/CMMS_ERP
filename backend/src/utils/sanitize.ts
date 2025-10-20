import DOMPurify from 'isomorphic-dompurify';
import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitize = {
  /**
   * Sanitize HTML content
   */
  html(input: string): string {
    if (!input) return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [],
    });
  },

  /**
   * Sanitize text input (removes HTML, keeps text)
   */
  text(input: string): string {
    if (!input) return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    }).trim();
  },

  /**
   * Sanitize email
   */
  email(input: string): string {
    if (!input) return '';
    return input.trim().toLowerCase();
  },

  /**
   * Sanitize object recursively
   */
  object<T extends Record<string, unknown>>(obj: T): T {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.text(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.object(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized as T;
  },
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize.object(req.body);
  }
  next();
};
